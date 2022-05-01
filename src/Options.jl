module OptionsModule

import Distributed: nworkers
import LossFunctions: L2DistLoss
import Zygote: gradient
#TODO - eventually move some of these
# into the SR call itself, rather than
# passing huge options at once.
import ..OperatorsModule: plus, pow, mult, sub, div, log_abs, log10_abs, log2_abs, log1p_abs, sqrt_abs, acosh_abs, atanh_clip
import ..EquationModule: Node, stringTree
import ..OptionsStructModule: Options

"""
         build_constraints(una_constraints, bin_constraints,
                           unary_operators, binary_operators)

Build constraints on operator-level complexity from a user-passed dict.
"""
function build_constraints(una_constraints, bin_constraints,
                           unary_operators, binary_operators,
                           nuna, nbin)::Tuple{Array{Int, 1}, Array{Tuple{Int,Int}, 1}}
    # Expect format ((*)=>(-1, 3)), etc.
    # TODO: Need to disable simplification if (*, -, +, /) are constrained?
    #  Or, just quit simplification is constraints violated.

    is_bin_constraints_already_done = typeof(bin_constraints) <: Array{Tuple{Int,Int},1}
    is_una_constraints_already_done = typeof(una_constraints) <: Array{Int,1}

    if typeof(bin_constraints) <: Array && !is_bin_constraints_already_done
        bin_constraints = Dict(bin_constraints)
    end
    if typeof(una_constraints) <: Array && !is_una_constraints_already_done
        una_constraints = Dict(una_constraints)
    end

    if una_constraints === nothing
        una_constraints = [-1 for i=1:nuna]
    elseif !is_una_constraints_already_done
        una_constraints::Dict
        _una_constraints = Int[]
        for (i, op) in enumerate(unary_operators)
            did_user_declare_constraints = haskey(una_constraints, op)
            if did_user_declare_constraints
                constraint::Int = una_constraints[op]
                push!(_una_constraints, constraint)
            else
                push!(_una_constraints, -1)
            end
        end
        una_constraints = _una_constraints
    end
    if bin_constraints === nothing
        bin_constraints = [(-1, -1) for i=1:nbin]
    elseif !is_bin_constraints_already_done
        bin_constraints::Dict
        _bin_constraints = Tuple{Int,Int}[]
        for (i, op) in enumerate(binary_operators)
            did_user_declare_constraints = haskey(bin_constraints, op)
            if did_user_declare_constraints
                constraint::Tuple{Int,Int} = bin_constraints[op]
                push!(_bin_constraints, constraint)
            else
                push!(_bin_constraints, (-1, -1))
            end
        end
        bin_constraints = _bin_constraints
    end

    return una_constraints, bin_constraints
end

function binopmap(op)
    if op == plus
        return +
    elseif op == mult
        return *
    elseif op == sub
        return -
    elseif op == div
        return /
    elseif op == ^
        return pow
    end
    return op
end

function unaopmap(op)
    if op == log
        return log_abs
    elseif op == log10
        return log10_abs
    elseif op == log2
        return log2_abs
    elseif op == log1p
        return log1p_abs
    elseif op == sqrt
        return sqrt_abs
    elseif op == acosh
        return acosh_abs
    elseif op == atanh
        return atanh_clip
    end
    return op
end


"""
    Options(;kws...)

Construct options for `EquationSearch` and other functions.
The current arguments have been tuned using the median values from
https://github.com/MilesCranmer/PySR/discussions/115.

# Arguments
- `binary_operators`: Tuple of binary
    operators to use. Each operator should be defined for two input scalars,
    and one output scalar. All operators need to be defined over the entire
    real line (excluding infinity - these are stopped before they are input).
    Thus, `log` should be replaced with `log_abs`, etc.
    For speed, define it so it takes two reals
    of the same type as input, and outputs the same type. For the SymbolicUtils
    simplification backend, you will need to define a generic method of the
    operator so it takes arbitrary types.
- `unary_operators`: Same, but for
    unary operators (one input scalar, gives an output scalar).
- `constraints`: Array of pairs specifying size constraints
    for each operator. The constraints for a binary operator should be a 2-tuple
    (e.g., `(-1, -1)`) and the constraints for a unary operator should be an `Int`.
    A size constraint is a limit to the size of the subtree
    in each argument of an operator. e.g., `[(^)=>(-1, 3)]` means that the
    `^` operator can have arbitrary size (`-1`) in its left argument,
    but a maximum size of `3` in its right argument. Default is
    no constraints.
- `batching`: Whether to evolve based on small mini-batches of data,
    rather than the entire dataset.
- `batchSize`: What batch size to use if using batching.
- `loss`: What loss function to use. Can be one of
    the following losses, or any other loss of type
    `SupervisedLoss`. You can also pass a function that takes
    a scalar target (left argument), and scalar predicted (right
    argument), and returns a scalar. This will be averaged
    over the predicted data. If weights are supplied, your
    function should take a third argument for the weight scalar.
    Included losses:
        Regression:
            - `LPDistLoss{P}()`,
            - `L1DistLoss()`,
            - `L2DistLoss()` (mean square),
            - `LogitDistLoss()`,
            - `HuberLoss(d)`,
            - `L1EpsilonInsLoss(ϵ)`,
            - `L2EpsilonInsLoss(ϵ)`,
            - `PeriodicLoss(c)`,
            - `QuantileLoss(τ)`,
        Classification:
            - `ZeroOneLoss()`,
            - `PerceptronLoss()`,
            - `L1HingeLoss()`,
            - `SmoothedL1HingeLoss(γ)`,
            - `ModifiedHuberLoss()`,
            - `L2MarginLoss()`,
            - `ExpLoss()`,
            - `SigmoidLoss()`,
            - `DWDMarginLoss(q)`.
- `npopulations`: How many populations of equations to use. By default
    this is set equal to the number of cores
- `npop`: How many equations in each population.
- `ncyclesperiteration`: How many generations to consider per iteration.
- `ns`: Number of equations in each subsample during regularized evolution.
- `topn`: Number of equations to return to the host process, and to
    consider for the hall of fame.
- `alpha`: The probability of accepting an equation mutation
    during regularized evolution is given by exp(-delta_loss/(alpha * T)),
    where T goes from 1 to 0. Thus, alpha=infinite is the same as no annealing.
- `maxsize`: Maximum size of equations during the search.
- `maxdepth`: Maximum depth of equations during the search, by default
    this is set equal to the maxsize.
- `parsimony`: A multiplicative factor for how much complexity is
    punished.
- `useFrequency`: Whether to use a parsimony that adapts to the
    relative proportion of equations at each complexity; this will
    ensure that there are a balanced number of equations considered
    for every complexity.
- `useFrequencyInTournament`: Whether to use the adaptive parsimony described
    above inside the score, rather than just at the mutation accept/reject stage.
- `fast_cycle`: Whether to thread over subsamples of equations during
    regularized evolution. Slightly improves performance, but is a different
    algorithm.
- `migration`: Whether to migrate equations between processes.
- `hofMigration`: Whether to migrate equations from the hall of fame
    to processes.
- `fractionReplaced`: What fraction of each population to replace with
    migrated equations at the end of each cycle.
- `fractionReplacedHof`: What fraction to replace with hall of fame
    equations at the end of each cycle.
- `shouldOptimizeConstants`: Whether to use NelderMead optimization
    to periodically optimize constants in equations.
- `optimizer_nrestarts`: How many different random starting positions to consider
    when using NelderMead optimization.
- `hofFile`: What file to store equations to, as a backup.
- `perturbationFactor`: When mutating a constant, either
    multiply or divide by (1+perturbationFactor)^(rand()+1).
- `probNegate`: Probability of negating a constant in the equation
    when mutating it.
- `mutationWeights`: Relative probabilities of the mutations, in the order: MutateConstant, MutateOperator, AddNode, InsertNode, DeleteNode, Simplify, Randomize, DoNothing.
- `annealing`: Whether to use simulated annealing.
- `warmupMaxsize`: Whether to slowly increase the max size from 5 up to
    `maxsize`. If nonzero, specifies how many cycles (populations*iterations)
    before increasing by 1.
- `verbosity`: Whether to print debugging statements or
    not.
- `bin_constraints`: See `constraints`. This is the same, but specified for binary
    operators only (for example, if you have an operator that is both a binary
    and unary operator).
- `una_constraints`: Likewise, for unary operators.
- `seed`: What random seed to use. `nothing` uses no seed.
- `progress`: Whether to use a progress bar output (`verbosity` will
    have no effect).
- `probPickFirst`: Expressions in subsample are chosen based on, for
    p=probPickFirst: p, p*(1-p), p*(1-p)^2, and so on.
- `earlyStopCondition`: Float - whether to stop early if the mean loss gets below this value.
    Function - a function taking (loss, complexity) as arguments and returning true or false.
- `timeout_in_seconds`: Float64 - the time in seconds after which to exit (as an alternative to the number of iterations).
- `max_evals`: Int (or Nothing) - the maximum number of evaluations of expressions to perform.
- `skip_mutation_failures`: Whether to simply skip over mutations that fail or are rejected, rather than to replace the mutated
    expression with the original expression and proceed normally.
- `enable_autodiff`: Whether to enable automatic differentiation functionality. This is turned off by default.
    If turned on, this will be turned off if one of the operators does not have well-defined gradients.
- `nested_constraints`: Specifies how many times a combination of operators can be nested. For example,
    `[sin => [cos => 0], cos => [cos => 2]]` specifies that `cos` may never appear within a `sin`,
    but `sin` can be nested with itself an unlimited number of times. The second term specifies that `cos`
    can be nested up to 2 times within a `cos`, so that `cos(cos(cos(x)))` is allowed (as well as any combination
    of `+` or `-` within it), but `cos(cos(cos(cos(x))))` is not allowed. When an operator is not specified,
    it is assumed that it can be nested an unlimited number of times. This requires that there is no operator
    which is used both in the unary operators and the binary operators (e.g., `-` could be both subtract, and negation).
    For binary operators, both arguments are treated the same way, and the max of each argument is constrained.
"""
function Options(;
    binary_operators::NTuple{nbin, Any}=(+, -, /, *),
    unary_operators::NTuple{nuna, Any}=(),
    constraints=nothing,
    loss=L2DistLoss(),
    ns=12, #1 sampled from every ns per mutation
    topn=12, #samples to return per population
    parsimony=0.0032f0,
    alpha=0.100000f0,
    maxsize=20,
    maxdepth=nothing,
    fast_cycle=false,
    migration=true,
    hofMigration=true,
    fractionReplacedHof=0.035f0,
    shouldOptimizeConstants=true,
    hofFile=nothing,
    npopulations=15,
    perturbationFactor=0.076f0,
    annealing=false,
    batching=false,
    batchSize=50,
    mutationWeights=[0.048, 0.47, 0.79, 5.1, 1.7, 0.0020, 0.00023, 0.21],
    crossoverProbability=0.066f0,
    warmupMaxsizeBy=0f0,
    useFrequency=true,
    useFrequencyInTournament=true,
    npop=33,
    ncyclesperiteration=550,
    fractionReplaced=0.00036f0,
    verbosity=convert(Int, 1e9),
    probNegate=0.01f0,
    seed=nothing,
    bin_constraints=nothing,
    una_constraints=nothing,
    progress=true,
    terminal_width=nothing,
    warmupMaxsize=nothing,
    optimizer_algorithm="BFGS",
    optimizer_nrestarts=2,
    optimize_probability=0.14f0,
    optimizer_iterations=8,
    recorder=nothing,
    recorder_file="pysr_recorder.json",
    probPickFirst=0.86f0,
    earlyStopCondition::Union{Function, AbstractFloat, Nothing}=nothing,
    stateReturn::Bool=false,
    use_symbolic_utils::Bool=false,
    timeout_in_seconds=nothing,
    max_evals=nothing,
    skip_mutation_failures::Bool=true,
    enable_autodiff::Bool=false,
    nested_constraints=nothing,
   ) where {nuna,nbin}

    if warmupMaxsize !== nothing
        error("warmupMaxsize is deprecated. Please use warmupMaxsizeBy, and give the time at which the warmup will end as a fraction of the total search cycles.")
    end

    if hofFile === nothing
        hofFile = "hall_of_fame.csv" #TODO - put in date/time string here
    end

    @assert maxsize > 3
    @assert warmupMaxsizeBy >= 0f0

    # Make sure nested_constraints contains functions within our operator set:
    if nested_constraints !== nothing
        # Check that intersection of binary operators and unary operators is empty:
        for op ∈ binary_operators
            if op ∈ unary_operators
                error("Operator " + op + " is both a binary and unary operator. You can't use nested constraints.")
            end
        end

        # Convert to dict:
        if !(typeof(nested_constraints) <: Dict)
            # Convert to dict:
            nested_constraints = Dict([
                cons[1] => Dict(cons[2]...)
                for cons in nested_constraints
            ]...)
        end
        for (op, nested_constraint) ∈ nested_constraints
            @assert op ∈ binary_operators || op ∈ unary_operators
            for (nested_op, max_nesting) ∈ nested_constraint
                @assert nested_op ∈ binary_operators || nested_op ∈ unary_operators
                @assert max_nesting >= -1 && typeof(max_nesting) <: Int
            end
        end

        # Lastly, we clean it up into a dict of (degree,op_idx) => max_nesting.
        new_nested_constraints = []
        # Dict()
        for (op, nested_constraint) ∈ nested_constraints
            (degree, idx) = if op ∈ binary_operators
                2, findfirst(isequal(op), binary_operators)
            else
                1, findfirst(isequal(op), unary_operators)
            end
            new_max_nesting_dict = []
            # Dict()
            for (nested_op, max_nesting) ∈ nested_constraint
                (nested_degree, nested_idx) = if nested_op ∈ binary_operators
                    2, findfirst(isequal(nested_op), binary_operators)
                else
                    1, findfirst(isequal(nested_op), unary_operators)
                end
                # new_max_nesting_dict[(nested_degree, nested_idx)] = max_nesting
                push!(new_max_nesting_dict, (nested_degree, nested_idx, max_nesting))
            end
            # new_nested_constraints[(degree, idx)] = new_max_nesting_dict
            push!(new_nested_constraints, (degree, idx, new_max_nesting_dict))
        end
        nested_constraints = new_nested_constraints
    end


    if typeof(constraints) <: Tuple
        constraints = collect(constraints)
    end
    if constraints !== nothing
        @assert bin_constraints === nothing
        @assert una_constraints === nothing
        # TODO: This is redundant with the checks in EquationSearch
        for op in binary_operators
            @assert !(op in unary_operators)
        end
        for op in unary_operators
            @assert !(op in binary_operators)
        end
        bin_constraints = constraints
        una_constraints = constraints
    end

    una_constraints, bin_constraints = build_constraints(una_constraints, bin_constraints,
                                                         unary_operators, binary_operators,
                                                         nuna, nbin)

    if maxdepth === nothing
        maxdepth = maxsize
    end

    if npopulations === nothing
        npopulations = nworkers()
    end

    binary_operators = map(binopmap, binary_operators)
    unary_operators = map(unaopmap, unary_operators)

    if enable_autodiff
        diff_binary_operators = Any[]
        diff_unary_operators = Any[]

        test_inputs = map(x->convert(Float32, x), LinRange(-100, 100, 99))
        # Create grid over [-100, 100]^2:
        test_inputs_xy = reduce(hcat, reduce(hcat, (
            [[[x, y] for x ∈ test_inputs] for y ∈ test_inputs]
        )))
        for op ∈ binary_operators
            diff_op(x, y) = gradient(op, x, y)
            
            test_output = diff_op.(test_inputs_xy[1, :], test_inputs_xy[2, :])
            gradient_exists = all((x) -> x!==nothing, Iterators.flatten(test_output))
            if gradient_exists
                push!(diff_binary_operators, diff_op)
            else
                if verbosity > 0
                    @warn "Automatic differentiation has been turned off, since operator $(op) does not have well-defined gradients."
                end
                enable_autodiff = false
                break
            end
        end

        for op ∈ unary_operators
            diff_op(x) = gradient(op, x)[1]
            test_output = diff_op.(test_inputs)
            gradient_exists = all((x) -> x!==nothing, test_output)
            if gradient_exists
                push!(diff_unary_operators, diff_op)
            else
                if verbosity > 0
                    @warn "Automatic differentiation has been turned off, since operator $(op) does not have well-defined gradients."
                end
                enable_autodiff = false
                break
            end
        end
        diff_binary_operators = Tuple(diff_binary_operators)
        diff_unary_operators = Tuple(diff_unary_operators)
    end

    if !enable_autodiff
        diff_binary_operators = nothing
        diff_unary_operators = nothing
    end


    mutationWeights = map((x,)->convert(Float64, x), mutationWeights)
    if length(mutationWeights) != 8
        error("Not the right number of mutation probabilities given")
    end

    for (op, f) in enumerate(map(Symbol, binary_operators))
        _f = if f == Symbol(pow)
            Symbol(^)
        else
            f
        end
        if !isdefined(Base, _f)
            continue
        end
        @eval begin
            Base.$_f(l::Node, r::Node)::Node = (l.constant && r.constant) ? Node($f(l.val, r.val)::AbstractFloat) : Node($op, l, r)
            Base.$_f(l::Node, r::AbstractFloat)::Node =        l.constant ? Node($f(l.val, r)::AbstractFloat)     : Node($op, l, r)
            Base.$_f(l::AbstractFloat, r::Node)::Node =        r.constant ? Node($f(l, r.val)::AbstractFloat)     : Node($op, l, r)
        end
    end

    # Redefine Base operations:
    for (op, f) in enumerate(map(Symbol, unary_operators))
        if !isdefined(Base, f)
            continue
        end
        @eval begin
            Base.$f(l::Node)::Node = l.constant ? Node($f(l.val)::AbstractFloat) : Node($op, l)
        end
    end

    if progress
        verbosity = 0
    end

    if recorder === nothing
        recorder = haskey(ENV, "PYSR_RECORDER") && (ENV["PYSR_RECORDER"] == "1")
    end

    if typeof(earlyStopCondition) <: AbstractFloat
        # Need to make explicit copy here for this to work:
        stopping_point = Float64(earlyStopCondition)
        earlyStopCondition = (loss, complexity) -> loss < stopping_point
    end

    options = Options{typeof(binary_operators),typeof(unary_operators), typeof(diff_binary_operators), typeof(diff_unary_operators), typeof(loss)}(binary_operators, unary_operators, diff_binary_operators, diff_unary_operators, bin_constraints, una_constraints, ns, parsimony, alpha, maxsize, maxdepth, fast_cycle, migration, hofMigration, fractionReplacedHof, shouldOptimizeConstants, hofFile, npopulations, perturbationFactor, annealing, batching, batchSize, mutationWeights, crossoverProbability, warmupMaxsizeBy, useFrequency, useFrequencyInTournament, npop, ncyclesperiteration, fractionReplaced, topn, verbosity, probNegate, nuna, nbin, seed, loss, progress, terminal_width, optimizer_algorithm, optimize_probability, optimizer_nrestarts, optimizer_iterations, recorder, recorder_file, probPickFirst, earlyStopCondition, stateReturn, use_symbolic_utils, timeout_in_seconds, max_evals, skip_mutation_failures, enable_autodiff, nested_constraints)

    @eval begin
        Base.print(io::IO, tree::Node) = print(io, stringTree(tree, $options))
        Base.show(io::IO, tree::Node) = print(io, stringTree(tree, $options))
    end
    
    return options
end


end
