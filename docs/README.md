# The docs folder

This is the home for high-level project documentation that doesn't belong in any specific component in the repository. The motivation for keeping it here is that it gets version-controlled alongside the source so there's a slight chance we remember to keep it up to date :D.

## Diagrams

Diagrams are made with [plantUML](https://plantuml.com), see their website for example syntax, documentation, and the full range of image types available (not just the UML diagrams). To re-generate diagrams after you update the source, run `make` in this folder.

When you do re-generate the diagrams, please commit them! We normally don't commit built artifacts to version control but in this case it makes it easier to share the documentation with various stakeholders and audiences, we just link them to the image in `main` and they have up-to-date docs.
