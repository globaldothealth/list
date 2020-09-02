# Contributing to the Global.health list

First of all, thank you for choosing to contribute some of your time to the Global.health list, you rock! :guitar:

Here are a few guidelines to help you understand the project, learn about the style guide, development best practices, how to write your first PR and make the world a better place.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](https://github.com/globaldothealth/list/blob/main/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## What can you contribute to?

The Global.health list is a project with multiple services in it, depending on your area of expertise you might want to start with looking for [issues](https://github.com/globaldothealth/list/issues) that are relevant to your skills.

The stack is MERN(Node.JS/Typescript MongoDB React based), with some Python in it.

The backend services are written in Node.JS.

The database used in production is Mongo DB Atlas.

The serving infrastructure is on AWS/EKS.

The UI is built with React.

Automated ingestion parsers are built in Python and run as AWS Lambdas functions.

Here are a few relevant open issues based on their labels:

- [Good first issues](https://github.com/globaldothealth/list/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
- [Infrastructure](https://github.com/globaldothealth/list/labels/Infrastructure)
- [Parsers for automated ingestion](https://github.com/globaldothealth/list/labels/importer)
- [Curator portal UI/React](https://github.com/globaldothealth/list/issues?q=is%3Aopen+is%3Aissue+label%3A%22Curator+Portal%22)
- [Documentation](https://github.com/globaldothealth/list/labels/Documentation) because there is never enough of it.

You can check out the [list of all labels](https://github.com/globaldothealth/list/labels) as well to help you figure out where to start.

## Report issues

A very good way to contribute is to report issues, either found when working on a PR or when simply using the Global.health list. We have issue templates to help you report feature requests or bugs, please use them when [reporting an issue](https://github.com/globaldothealth/list/issues/new/choose).

## Developer documentation

The documentation for devs can be found in the [`/dev`](https://github.com/globaldothealth/list/blob/main/dev/README.md) directory.

It should contain all the necessary information to run a full stack locally and get you started on your first PR.

We use the [Git Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow) for development. You should always have a working `main` branch and features being developed in parallel branches then merged into `main`.

## Improvements 

New feature / field / style request maybe made by raising an issue, adding an appropriate label and assigning it to @outbreakprepared 

Your suggestion would be reviewed and you would be notified when a decision is reached with next steps. 

## Testing

We have numerous [github actions](https://github.com/globaldothealth/list/actions) that run on every PR and push to the `main` branch. Make sure your PR actions are green before requesting a review. We also protect the `main` branch so reviews are required, you will not get an approval if the actions are not passing so please, add and fix tests whenever possible.
