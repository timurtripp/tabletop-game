# Tabletop Game – Tim Tripp CSCI 5229 Final Project

**Demo: [https://timurtripp.com/webgl](https://timurtripp.com/webgl)**

The tabletop game setup consists of metalic colored dice sets (d20, d12, d10, d8, d6, d4), and a battle map with player &amp; NPC tokens, all randomly distributed. The scene is rendered using pure WebGL and custom shaders.

Asset credits:
- [FoundryVTT Dice So Nice](https://gitlab.com/riccisi/foundryvtt-dice-so-nice) for the 3D dice (the number font is custom and differs from theirs).
- [Low Poly UV Mapped Desk Table Free low-poly 3D model](https://www.cgtrader.com/free-3d-models/furniture/furniture-set/low-poly-uv-mapped-desktable) for the table (the textures were modified to fit in a single image file).
- Tokens: [Player](https://www.thingiverse.com/thing:4573344), [Dragon](https://www.thingiverse.com/thing:4820671) (these were originally modeled for 3D printing and modified for this application).
- [Blender](https://www.blender.org) for editing the asset files.

Texture credits:
- [My Free Textures](https://www.myfreetextures.com/)

## Controls
Click (or touch) and drag to rotate the point of view. Use the buttons at the bottom left to shuffle the items, zoom in, or zoom out. The zoom in or out can also be accomplished using the scroll wheel on desktop.

## Running
This repository includes a simple web server implementation to overcome the issues that arise from opening the index.html as a local file in the browser. To start the server, run `npm run serve` in the project folder and navigate to `http://localhost:8080/` in your browser to see the demo. The server listens on port `8080` by default.

## Development
The project builds using [Webpack](https://webpack.js.org). Install all required dependencies with `npm i` and watch using `npm run watch` or build using `npm run build`. The built script is created as `dist/main.js`. These steps are **not** required if simply wanting to run the project and `dist/main.js` already exists – ignore this section and refer to the one above.

## Known issues
- All the dice are showing the same number, they should be random. Estimated fix difficulty: hard (rotation is difficult to get right for a face, and with the d20 there are 20 such face rotations, 12 with the d12, and so on).

## What I wish I had time for
- 3D physics for picking up and rolling dice. Maybe after the semester I'll work on this by learning a physics library like CannonJS.
