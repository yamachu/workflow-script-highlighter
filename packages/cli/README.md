# github-script checker

This tool checks the type of JavaScript codes written in the script element of actions/github-script.

## Usage

### Install or use npx

```sh
# without install
$ npx -p @yamachu/github-script-checker github-script-checker <path>
# with install locally
$ npm install @yamachu/github-script-checker
$ npx github-script-checker <path>
```

### File format

Enclose the code block with ````#```typescript```` and ```` #``` ```` as shown below.

```yaml
- uses: actions/github-script@v7
  with:
    script: | #```typescript
      // Here is JavaScript code
    #```
```

## Example

.github/workflows/sample.yml

```yaml
name: sample
on: push
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: | #```typescript
            console.log('hello')
            await github.rest.issues.createComment({
              body: 'Hello, World!',
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
            });
          #```
      - uses: actions/github-script@v7
        with:
          script: | #```typescript
            core.debug('Hello, World!');
            github.rest.isuees ; // oops, typo
            // show errors, ')' expected
            foo.bar(;
          #```
```

Run the following command.

```sh
$ npx -p @yamachu/github-script-checker github-script-checker .github/workflows/example.yml

../../sample/.github/workflows/sample.yml:24:13 - error ts(2304): Cannot find name 'foo'.

24             foo.bar(;
               ~~~
../../sample/.github/workflows/sample.yml:22:25 - error ts(2551): Property 'isuees' does not exist on type 'RestEndpointMethods'. Did you mean 'issues'?

22             github.rest.isuees ; // oops, typo
                           ~~~~~~
../../sample/.github/workflows/sample.yml:24:21 - error ts(1005): ')' expected.

24             foo.bar(;
                       ~

```
