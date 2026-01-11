# Contributing

Thanks for contributing to Itchy!  We're striving to create the best Scratch experience possible for mobile devices.  This is a guide to help you get started with your first Itchy contribution.

## Getting started

If you intend on contributing back to this project (and not just making your own build), you'll want to fork this repo to your own GitHub profile.  Then, clone it to your computer with this command: `git clone https://github.com/yourusername/itchy-native`.  Next, follow the guide in our [README](../README.md) to get the project set up.

## Design philosophy

Itchy should be accessible and easy to work with from both a user and a developer standpoint.  Keep in mind the Scratch userbase (mainly 8-12 year olds) when adding features to the app.  Power user additions are welcome, but the vast majority of features should be simple enough that kids can understand them.  

From a code perspective, a developer should be able to hop into Itchy's codebase and immediately feel comfortable to start implementing a feature or bugfix.  This means clean code, but not at the expense of readability.  Any odd hacks should be documented by comments, and everything else should be clearly typed using [TypeScript](https://www.typescriptlang.org), or, in certain applications, [JSDoc](https://jsdoc.app).

## Repo folders

This repository is organized into several folders, and their purposes are all specific.  It is worth noting that the files and subfolders in the `app` folder are arranged in their navigation permissions.  For example, the user profile page is at `/app/users/[username]/index.tsx`

- **`app`** - the main screen files that run Itchy's logic and UI
- **`assets`** - where images, icons, and other assets are stored
- **`components`** - reusable components that are used throughout the Itchy UI
- **`patches`** - patches that work with [patch-package](https://www.npmjs.com/package/patch-package) to fix any bugs in dependencies
- **`utils`** - reusable logic that is used throughout Itchy
  - **`api-wrapper`** - the code that interacts with the [Scratch API](https://towerofnix.github.io/scratch-api-unofficial-docs/)
  - **`hooks`** - custom React hooks used throughout the app
  - **`regex`** - regular expression logic used to find and replace text
  - **`theme`** - variables and utils that assist with Itchy's visual look

## Generative AI policy

We recognize that by this point, LLMs are critical to the majority of developers' workflows.  Using Copilot or similar LLMs to help write code to contribute to Itchy is fine, provided that it is used as an assistant and not the primary author.  This means that "vibe coded" features or fixes will **not** be accepted into this project.  If you feel that a significant amount of your code is AI-generated, please provide a disclaimer in your pull request.