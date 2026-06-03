# Refactor Candidates

Apply refactors only when GREEN (all tests pass). Run tests after each step.

## Candidates to look for

### 1. Duplication

Three or more similar blocks → extract. Two similar blocks → leave alone (premature abstraction is worse than duplication).

### 2. Shallow modules

A class/file with many small methods that mostly forward calls is a shallow module. Merge it into its caller, or push complexity into it so the interface becomes meaningfully simpler. See [deep-modules.md](deep-modules.md).

### 3. Leaky abstractions

If the caller needs to know HOW the module works to use it correctly, the abstraction is leaky. Fix by hiding more inside, or by changing the interface to make misuse impossible.

### 4. Pass-through parameters

A parameter that gets passed through 3+ layers without being inspected is a smell — usually the wrong module owns the data.

### 5. Boolean flag parameters

`doThing(x, true)` is unreadable. Split into `doThingFast(x)` and `doThingSlow(x)`, or take a typed option object.

### 6. Long parameter lists

5+ parameters → group into an object, or the function is doing too much.

### 7. Comments explaining WHAT

If a comment says what the code does, rename the code so the comment is unnecessary. Only keep comments that explain WHY.

## Refactor discipline

- Make ONE change at a time
- Run tests after each change
- If tests break, revert immediately — don't pile on more changes
- Commit between refactors so you can bisect

## When NOT to refactor

- While RED (focus on getting green first)
- Just before a release
- In code you don't fully understand (add tests first)
- For aesthetic reasons alone — leave it
