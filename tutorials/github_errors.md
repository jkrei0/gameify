
### Generic errors
There are a number of things that might go wrong when dealing with GitHub. Click the `Visual` tab, and look at the console in the bottom of the screen to see what went wrong.

- `Session Expired` or `Session Invalid`: You aren't logged in to Gameify, or you need to log in again. Click the log in link, or your username in the top right of the screen, log in, and try again.
- `Need permissions`: Gameify doesn't have access to the repository. Click the link to update your GitHub permissions, and make sure to give Gameify access to that repository.
- `Github unauthorized`: You're not signed into GitHub. Click the link to sign in, and if the issue persists, click the link to update your github permissions. If you're still having trouble, <a href="https://github.com/jkrei0/gameify/issues" target="_blank">file an issue</a>.
- `Unable to clone repository`: Make sure the repository is corect (look in the URL and make sure there's not a typo). If the issue continues, <a href="https://github.com/jkrei0/gameify/issues" target="_blank">file an issue</a> in GitHub.
- `No .gfengine file`: The repository doesn't have a `.gfengine` file. Make sure you uploaded all of the files that you downloaded, and that there's a `.gfengine` file in the repository. It should look something like this:
```
# What folder gameify should read files from
FOLDER:.
# The objects file
OBJECTS:objects.gpj
# Any files to ignore (one per line)
IGNORE:file.txt
```
- `Invalid or missing objects file`: Gameify couldn't find the `objects.gpj` file in the repository. Make sure you uploaded all of the files that you downloaded,  that there's a `objects.gpj` file in the repository, and that your `.gfengine` file has a line that says `OBJECTS:objects.gpj`.

### Push errors
These errors can happen when pushing changes:

- `Merge confllict`: There was a merge conflict. When this happens, gameify pushes to a new branch, and you'll have to <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request" target="_blank">create a pull request</a> and <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github" target="_blank">resolve the issue on github</a>.
- `Error committing changes`: Something went wrong when trying to commit changes. You should <a href="https://github.com/jkrei0/gameify/issues" target="_blank">file an issue</a>.
- `Unable to clone repository, or error pushing changes`: Something went wrong when trying to push changes. You should <a href="https://github.com/jkrei0/gameify/issues" target="_blank">file an issue</a>.