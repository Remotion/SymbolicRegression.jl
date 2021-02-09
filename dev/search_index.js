var documenterSearchIndex = {"docs":
[{"location":"api/#API","page":"API","title":"API","text":"","category":"section"},{"location":"api/#EquationSearch","page":"API","title":"EquationSearch","text":"","category":"section"},{"location":"api/","page":"API","title":"API","text":"EquationSearch(X::AbstractMatrix{T}, y::AbstractVector{T};\n        niterations::Int=10,\n        weights::Union{AbstractVector{T}, Nothing}=nothing,\n        varMap::Union{Array{String, 1}, Nothing}=nothing,\n        options::Options=Options(),\n        numprocs::Union{Int, Nothing}=nothing,\n        procs::Union{Array{Int, 1}, Nothing}=nothing,\n        runtests::Bool=true\n       ) where {T<:Real}","category":"page"},{"location":"api/#SymbolicRegression.EquationSearch-Union{Tuple{T}, Tuple{AbstractArray{T,2},AbstractArray{T,1}}} where T<:Real","page":"API","title":"SymbolicRegression.EquationSearch","text":"EquationSearch(X, y[; kws...])\n\nPerform a distributed equation search for functions which describe the mapping f(X[:, j]) ≈ y[j]. Options are configured using SymbolicRegression.Options(...), which should be passed as a keyword argument to options. One can turn off parallelism with numprocs=0, which is useful for debugging and profiling.\n\nArguments\n\nX::AbstractMatrix{T}:  The input dataset to predict y from.   The first dimension is features, the second dimension is rows.\ny::AbstractVector{T}: The values to predict. Only a single feature   is allowed, so y is a 1D array.\nniterations::Int=10: The number of iterations to perform the search.   More iterations will improve the results.\nweights::Union{AbstractVector{T}, Nothing}=nothing: Optionally   weight the loss for each y by this value (same shape as y).\nvarMap::Union{Array{String, 1}, Nothing}=nothing: The names   of each feature in X, which will be used during printing of equations.\noptions::Options=Options(): The options for the search, such as   which operators to use, evolution hyperparameters, etc.\nnumprocs::Union{Int, Nothing}=nothing:  The number of processes to use,   if you want EquationSearch to set this up automatically. By default   this will be 4, but can be any number (you should pick a number <=   the number of cores available).\nprocs::Union{Array{Int, 1}, Nothing}=nothing: If you have set up   a distributed run manually with procs = addprocs() and @everywhere,   pass the procs to this keyword argument.\nruntests::Bool=true: Whether to run (quick) tests before starting the   search, to see if there will be any problems during the equation search   related to the host environment.\n\nReturns\n\nhallOfFame::HallOfFame: The best equations seen during the search.   hallOfFame.members gives an array of PopMember objects, which   have their tree (equation) stored in .tree. Their score (loss)   is given in .score. The array of PopMember objects   is enumerated by size from 1 to options.maxsize.\n\n\n\n\n\n","category":"method"},{"location":"api/#Options","page":"API","title":"Options","text":"","category":"section"},{"location":"api/","page":"API","title":"API","text":"Options(;\n    binary_operators::NTuple{nbin, Any}=(div, plus, mult),\n    unary_operators::NTuple{nuna, Any}=(exp, cos),\n    bin_constraints=nothing,\n    una_constraints=nothing,\n    ns=10, #1 sampled from every ns per mutation\n    topn=10, #samples to return per population\n    parsimony=0.000100f0,\n    alpha=0.100000f0,\n    maxsize=20,\n    maxdepth=nothing,\n    fast_cycle=false,\n    migration=true,\n    hofMigration=true,\n    fractionReplacedHof=0.1f0,\n    shouldOptimizeConstants=true,\n    hofFile=nothing,\n    npopulations=nothing,\n    nrestarts=3,\n    perturbationFactor=1.000000f0,\n    annealing=true,\n    batching=false,\n    batchSize=50,\n    mutationWeights=[10.000000, 1.000000, 1.000000, 3.000000, 3.000000, 0.010000, 1.000000, 1.000000],\n    warmupMaxsize=0,\n    useFrequency=false,\n    npop=1000,\n    ncyclesperiteration=300,\n    fractionReplaced=0.1f0,\n    verbosity=convert(Int, 1e9),\n    probNegate=0.01f0,\n    seed=nothing\n   ) where {nuna,nbin}","category":"page"},{"location":"api/#SymbolicRegression.Options-Union{Tuple{}, Tuple{nbin}, Tuple{nuna}} where nbin where nuna","page":"API","title":"SymbolicRegression.Options","text":"Options(;kws...)\n\nConstruct options for EquationSearch and other functions.\n\nArguments\n\nbinary_operators=(div, plus, mult): Tuple of binary   operators to use. Each operator should be defined for two input scalars,   and one output scalar. All operators need to be defined over the entire   real line (excluding infinity - these are stopped before they are input).   Thus, log should be replaced with log_abs, etc.   For speed, define it so it takes two reals   of the same type as input, and outputs the same type. For the SymbolicUtils   simplification backend, you will need to define a generic method of the   operator so it takes arbitrary types.\nunary_operators=(exp, cos): Same, but for   unary operators (one input scalar, gives an output scalar).\nconstraints=nothing: Array of pairs specifying size constraints   for each operator. The constraints for a binary operator should be a 2-tuple   (e.g., (-1, -1)) and the constraints for a unary operator should be an Int.   A size constraint is a limit to the size of the subtree   in each argument of an operator. e.g., [(^)=>(-1, 3)] means that the   ^ operator can have arbitrary size (-1) in its left argument,   but a maximum size of 3 in its right argument. Default is   no constraints.\nbatching=false: Whether to evolve based on small mini-batches of data,   rather than the entire dataset.\nbatchSize=50: What batch size to use if using batching.\nnpopulations=nothing: How many populations of equations to use. By default   this is set equal to the number of cores\nnpop=1000: How many equations in each population.\nncyclesperiteration=300: How many generations to consider per iteration.\nns=10: Number of equations in each subsample during regularized evolution.\ntopn=10: Number of equations to return to the host process, and to   consider for the hall of fame.\nalpha=0.100000f0: The probability of accepting an equation mutation   during regularized evolution is given by exp(-delta_loss/(alpha * T)),   where T goes from 1 to 0. Thus, alpha=infinite is the same as no annealing.\nmaxsize=20: Maximum size of equations during the search.\nmaxdepth=nothing: Maximum depth of equations during the search, by default   this is set equal to the maxsize.\nparsimony=0.000100f0: A multiplicative factor for how much complexity is   punished.\nuseFrequency=false: Whether to use a parsimony that adapts to the   relative proportion of equations at each complexity; this will   ensure that there are a balanced number of equations considered   for every complexity.\nfast_cycle=false: Whether to thread over subsamples of equations during   regularized evolution. Slightly improves performance, but is a different   algorithm.\nmigration=true: Whether to migrate equations between processes.\nhofMigration=true: Whether to migrate equations from the hall of fame   to processes.\nfractionReplaced=0.1f0: What fraction of each population to replace with   migrated equations at the end of each cycle.\nfractionReplacedHof=0.1f0: What fraction to replace with hall of fame   equations at the end of each cycle.\nshouldOptimizeConstants=true: Whether to use NelderMead optimization   to periodically optimize constants in equations.\nnrestarts=3: How many different random starting positions to consider   when using NelderMead optimization.\nhofFile=nothing: What file to store equations to, as a backup.\nperturbationFactor=1.000000f0: When mutating a constant, either   multiply or divide by (1+perturbationFactor)^(rand()+1).\nprobNegate=0.01f0: Probability of negating a constant in the equation   when mutating it.\nmutationWeights=[10.000000, 1.000000, 1.000000, 3.000000, 3.000000, 0.010000, 1.000000, 1.000000]:\nannealing=true: Whether to use simulated annealing.\nwarmupMaxsize=0: Whether to slowly increase the max size from 5 up to   maxsize. If nonzero, specifies how many cycles (populations*iterations)   before increasing by 1.\nverbosity=convert(Int, 1e9): Whether to print debugging statements or   not.\nbin_constraints=nothing:\nuna_constraints=nothing:\nseed=nothing: What random seed to use. nothing uses no seed.\n\n\n\n\n\n","category":"method"},{"location":"api/#Printing-and-Evaluation","page":"API","title":"Printing and Evaluation","text":"","category":"section"},{"location":"api/","page":"API","title":"API","text":"stringTree(tree::Node, options::Options)","category":"page"},{"location":"api/#SymbolicRegression.stringTree-Tuple{Node,Options}","page":"API","title":"SymbolicRegression.stringTree","text":"stringTree(tree::Node, options::Options; kws...)\n\nConvert an equation to a string.\n\nArguments\n\nvarMap::Union{Array{String, 1}, Nothing}=nothing: what variables   to print for each feature.\n\n\n\n\n\n","category":"method"},{"location":"api/","page":"API","title":"API","text":"evalTreeArray(tree::Node, cX::AbstractMatrix{T}, options::Options) where {T<:Real}","category":"page"},{"location":"api/#SymbolicRegression.evalTreeArray-Union{Tuple{T}, Tuple{Node,AbstractArray{T,2},Options}} where T<:Real","page":"API","title":"SymbolicRegression.evalTreeArray","text":"evalTreeArray(tree::Node, cX::AbstractMatrix{T}, options::Options)\n\nEvaluate a binary tree (equation) over a given input data matrix. The options contain all of the operators used. This function fuses doublets and triplets of operations for lower memory usage.\n\nReturns\n\n(output, complete)::Tuple{AbstractVector{T}, Bool}: the result,   which is a 1D array, as well as if the evaluation completed   successfully (true/false). A false complete means an infinity   or nan was encountered, and a large loss should be assigned   to the equation.\n\n\n\n\n\n","category":"method"},{"location":"api/#SymbolicUtils.jl-interface","page":"API","title":"SymbolicUtils.jl interface","text":"","category":"section"},{"location":"api/","page":"API","title":"API","text":"node_to_symbolic(tree::Node, options::Options; \n                     varMap::Union{Array{String, 1}, Nothing}=nothing,\n                     evaluate_functions::Bool=false,\n                     index_functions::Bool=false)","category":"page"},{"location":"api/#SymbolicRegression.node_to_symbolic-Tuple{Node,Options}","page":"API","title":"SymbolicRegression.node_to_symbolic","text":"node_to_symbolic(tree::Node, options::Options;\n            varMap::Union{Array{String, 1}, Nothing}=nothing,\n            evaluate_functions::Bool=false,\n            index_functions::Bool=false)\n\nThe interface to SymbolicUtils.jl. Passing a tree to this function will generate a symbolic equation in SymbolicUtils.jl format.\n\nArguments\n\ntree::Node: The equation to convert.\noptions::Options: Options, which contains the operators used in the equation.\nvarMap::Union{Array{String, 1}, Nothing}=nothing: What variable names to use for   each feature. Default is [x1, x2, x3, ...].\nevaluate_functions::Bool=false: Whether to evaluate the operators, or   leave them as symbolic.\nindex_functions::Bool=false: Whether to generate special names for the   operators, which then allows one to convert back to a Node format   using symbolic_to_node.\n\n\n\n\n\n","category":"method"},{"location":"api/#Pareto-frontier","page":"API","title":"Pareto frontier","text":"","category":"section"},{"location":"api/","page":"API","title":"API","text":"calculateParetoFrontier(X::AbstractMatrix{T}, y::AbstractVector{T},\n                        hallOfFame::HallOfFame, options::Options;\n                        weights=nothing, varMap=nothing) where {T<:Real}\ncalculateParetoFrontier(dataset::Dataset{T}, hallOfFame::HallOfFame,\n                        options::Options) where {T<:Real}","category":"page"},{"location":"api/#SymbolicRegression.calculateParetoFrontier-Union{Tuple{T}, Tuple{AbstractArray{T,2},AbstractArray{T,1},HallOfFame,Options}} where T<:Real","page":"API","title":"SymbolicRegression.calculateParetoFrontier","text":"calculateParetoFrontier(X::AbstractMatrix{T}, y::AbstractVector{T},\n                        hallOfFame::HallOfFame, options::Options;\n                        weights=nothing, varMap=nothing) where {T<:Real}\n\nCompute the dominating Pareto frontier for a given hallOfFame. This is the list of equations where each equation has a better loss than all simpler equations.\n\n\n\n\n\n","category":"method"},{"location":"api/#SymbolicRegression.calculateParetoFrontier-Union{Tuple{T}, Tuple{Dataset{T},HallOfFame,Options}} where T<:Real","page":"API","title":"SymbolicRegression.calculateParetoFrontier","text":"calculateParetoFrontier(dataset::Dataset{T}, hallOfFame::HallOfFame,\n                        options::Options) where {T<:Real}\n\n\n\n\n\n","category":"method"},{"location":"#SymbolicRegression.jl","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"","category":"section"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Latest release Documentation Build status Coverage\n(Image: version) (Image: Dev) (Image: Stable) (Image: CI) (Image: Coverage Status)","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Distributed High-Performance symbolic regression in Julia.","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Check out PySR for a Python frontend.","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Cite this software","category":"page"},{"location":"#Quickstart","page":"SymbolicRegression.jl","title":"Quickstart","text":"","category":"section"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Install in Julia with:","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"using Pkg\nPkg.add(\"SymbolicRegression\")","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"The heart of this package is the EquationSearch function, which takes a 2D array (shape [features, rows]) and attempts to model a 1D array (shape [rows]) using analytic functional forms.","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Run distributed on four processes with:","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"using SymbolicRegression\n\nX = randn(Float32, 5, 100)\ny = 2 * cos.(X[4, :]) + X[1, :] .^ 2 .- 2\n\noptions = SymbolicRegression.Options(\n    binary_operators=(+, *, /, -),\n    unary_operators=(cos, exp),\n    npopulations=20\n)\n\nhallOfFame = EquationSearch(X, y, niterations=5, options=options, numprocs=4)","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"We can view the equations in the dominating Pareto frontier with:","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"dominating = calculateParetoFrontier(X, y, hallOfFame, options)","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"We can convert the best equation to SymbolicUtils.jl with the following function:","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"eqn = node_to_symbolic(dominating[end].tree, options)\nprintln(simplify(eqn*5 + 3))","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"We can also print out the full pareto frontier like so:","category":"page"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"println(\"Complexity\\tMSE\\tEquation\")\n\nfor member in dominating\n    size = countNodes(member.tree)\n    score = member.score\n    string = stringTree(member.tree, options)\n\n    println(\"$(size)\\t$(score)\\t$(string)\")\nend","category":"page"},{"location":"#Contents","page":"SymbolicRegression.jl","title":"Contents","text":"","category":"section"},{"location":"","page":"SymbolicRegression.jl","title":"SymbolicRegression.jl","text":"Pages = [\"api.md\", \"types.md\"]","category":"page"},{"location":"types/#Types","page":"Types","title":"Types","text":"","category":"section"},{"location":"types/#Equations","page":"Types","title":"Equations","text":"","category":"section"},{"location":"types/","page":"Types","title":"Types","text":"Equations are specified as binary trees with the Node type. Operators defined in Base are re-defined for Node types, so that one can use, e.g., t=Node(1) * 3f0 to create a tree.","category":"page"},{"location":"types/","page":"Types","title":"Types","text":"Node(val::AbstractFloat)\nNode(feature::Int)\nNode(var_string::String)\nNode(var_string::String, varMap::Array{String, 1})\nNode(op::Int, l::Node)\nNode(op::Int, l::Union{AbstractFloat, Int})\nNode(op::Int, l::Node, r::Node)\nNode(op::Int, l::Union{AbstractFloat, Int}, r::Node)\nNode(op::Int, l::Node, r::Union{AbstractFloat, Int})\nNode(op::Int, l::Union{AbstractFloat, Int}, r::Union{AbstractFloat, Int})","category":"page"},{"location":"types/#SymbolicRegression.Node-Tuple{AbstractFloat}","page":"Types","title":"SymbolicRegression.Node","text":"Node(val::AbstractFloat)\n\nCreate a scalar constant node\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64}","page":"Types","title":"SymbolicRegression.Node","text":"Node(feature::Int)\n\nCreate a variable node using feature feature::Int\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{String}","page":"Types","title":"SymbolicRegression.Node","text":"Node(var_string::String)\n\nCreate a variable node, using the format \"x1\" to mean feature 1\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{String,Array{String,1}}","page":"Types","title":"SymbolicRegression.Node","text":"Node(var_string::String, varMap::Array{String, 1})\n\nCreate a variable node, using a user-passed format\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64,Node}","page":"Types","title":"SymbolicRegression.Node","text":"Node(op::Int, l::Node)\n\nApply unary operator op (enumerating over the order given) to Node l\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64,Union{Int64, AbstractFloat}}","page":"Types","title":"SymbolicRegression.Node","text":"Node(op::Int, l::Union{AbstractFloat, Int})\n\nShort-form for creating a scalar/variable node, and applying a unary operator\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64,Node,Node}","page":"Types","title":"SymbolicRegression.Node","text":"Node(op::Int, l::Node, r::Node)\n\nApply binary operator op (enumerating over the order given) to Nodes l and r\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64,Union{Int64, AbstractFloat},Node}","page":"Types","title":"SymbolicRegression.Node","text":"Node(op::Int, l::Union{AbstractFloat, Int}, r::Node)\n\nShort-form to create a scalar/variable node, and apply a binary operator\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64,Node,Union{Int64, AbstractFloat}}","page":"Types","title":"SymbolicRegression.Node","text":"Node(op::Int, l::Node, r::Union{AbstractFloat, Int})\n\nShort-form to create a scalar/variable node, and apply a binary operator\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Node-Tuple{Int64,Union{Int64, AbstractFloat},Union{Int64, AbstractFloat}}","page":"Types","title":"SymbolicRegression.Node","text":"Node(op::Int, l::Union{AbstractFloat, Int}, r::Union{AbstractFloat, Int})\n\nShort-form for creating two scalar/variable node, and applying a binary operator\n\n\n\n\n\n","category":"method"},{"location":"types/#Population","page":"Types","title":"Population","text":"","category":"section"},{"location":"types/","page":"Types","title":"Types","text":"Groups of equations are given as a population, which is an array of trees tagged with score and birthdate–-these values are given in the PopMember.","category":"page"},{"location":"types/","page":"Types","title":"Types","text":"Population(pop::Array{PopMember{T}, 1}) where {T<:Real}\nPopulation(dataset::Dataset{T}, baseline::T;\n           npop::Int, nlength::Int=3,\n           options::Options,\n           nfeatures::Int) where {T<:Real}\nPopulation(X::AbstractMatrix{T}, y::AbstractVector{T}, baseline::T;\n           npop::Int, nlength::Int=3,\n           options::Options,\n           nfeatures::Int) where {T<:Real}","category":"page"},{"location":"types/#SymbolicRegression.Population-Union{Tuple{Array{PopMember{T},1}}, Tuple{T}} where T<:Real","page":"Types","title":"SymbolicRegression.Population","text":"Population(pop::Array{PopMember{T}, 1})\n\nCreate population from list of PopMembers.\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Population-Union{Tuple{T}, Tuple{Dataset{T},T}} where T<:Real","page":"Types","title":"SymbolicRegression.Population","text":"Population(dataset::Dataset{T}, baseline::T;\n           npop::Int, nlength::Int=3, options::Options,\n           nfeatures::Int)\n\nCreate random population and score them on the dataset.\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.Population-Union{Tuple{T}, Tuple{AbstractArray{T,2},AbstractArray{T,1},T}} where T<:Real","page":"Types","title":"SymbolicRegression.Population","text":"Population(X::AbstractMatrix{T}, y::AbstractVector{T},\n           baseline::T; npop::Int, nlength::Int=3,\n           options::Options, nfeatures::Int)\n\nCreate random population and score them on the dataset.\n\n\n\n\n\n","category":"method"},{"location":"types/#Population-members","page":"Types","title":"Population members","text":"","category":"section"},{"location":"types/","page":"Types","title":"Types","text":"PopMember(t::Node, score::T) where {T<:Real}\nPopMember(dataset::Dataset{T}, baseline::T, t::Node, options::Options) where {T<:Real}","category":"page"},{"location":"types/#SymbolicRegression.PopMember-Union{Tuple{T}, Tuple{Node,T}} where T<:Real","page":"Types","title":"SymbolicRegression.PopMember","text":"PopMember(t::Node, score::T)\n\nCreate a population member with a birth date at the current time.\n\nArguments\n\nt::Node: The tree for the population member.\nscore::T: The loss to assign this member.\n\n\n\n\n\n","category":"method"},{"location":"types/#SymbolicRegression.PopMember-Union{Tuple{T}, Tuple{Dataset{T},T,Node,Options}} where T<:Real","page":"Types","title":"SymbolicRegression.PopMember","text":"PopMember(dataset::Dataset{T}, baseline::T,\n          t::Node, options::Options)\n\nCreate a population member with a birth date at the current time. Automatically compute the score for this tree.\n\nArguments\n\ndataset::Dataset{T}: The dataset to evaluate the tree on.\nbaseline::T: The baseline loss.\nt::Node: The tree for the population member.\noptions::Options: What options to use.\n\n\n\n\n\n","category":"method"},{"location":"types/#Hall-of-Fame","page":"Types","title":"Hall of Fame","text":"","category":"section"},{"location":"types/","page":"Types","title":"Types","text":"HallOfFame(options::Options)","category":"page"},{"location":"types/#SymbolicRegression.HallOfFame-Tuple{Options}","page":"Types","title":"SymbolicRegression.HallOfFame","text":"HallOfFame(options::Options)\n\nCreate empty HallOfFame. The HallOfFame stores a list of PopMember objects in .members, which is enumerated by size (i.e., .members[1] is the constant solution). .exists is used to determine whether the particular member has been instantiated or not.\n\n\n\n\n\n","category":"method"},{"location":"types/#Dataset","page":"Types","title":"Dataset","text":"","category":"section"},{"location":"types/","page":"Types","title":"Types","text":"Dataset(X::AbstractMatrix{T},\n        y::AbstractVector{T};\n        weights::Union{AbstractVector{T}, Nothing}=nothing,\n        varMap::Union{Array{String, 1}, Nothing}=nothing\n       ) where {T<:Real}","category":"page"},{"location":"types/#SymbolicRegression.Dataset-Union{Tuple{T}, Tuple{AbstractArray{T,2},AbstractArray{T,1}}} where T<:Real","page":"Types","title":"SymbolicRegression.Dataset","text":"Dataset(X::AbstractMatrix{T}, y::AbstractVector{T};\n        weights::Union{AbstractVector{T}, Nothing}=nothing,\n        varMap::Union{Array{String, 1}, Nothing}=nothing)\n\nConstruct a dataset to pass between internal functions.\n\n\n\n\n\n","category":"method"}]
}
