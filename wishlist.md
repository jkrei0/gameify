# Wishlist

Things I would like to add, roughly in order.

## Close goals
- **UI Tools** UI Tools like buttons and better text, plus styling and configuration
- **Animation** - Add animation tools to sprites (and maybe tilemaps/tilesets)
  - **Scene transitions** - Animations and events for scene transitions
- **Input manager** - Assign keys to actions, key rebinding, etc. (inspired by godot's input manager), and potentially gamepad support

## Mid-range goals

- **Save-load tools** - Tools for saving/loading game data
- **Visual effects** - VFX including screen shake, distortion, particles, etc
- **Resource Management** - Better image/audio/etc management - Loading and unloading, and storage in some way that's not dataURIs for everything.
  - **Asset management** - Image, audio, etc manager
- **Networking** - Tools for multiplayer games
    - **Player controls** - Tools for controlling multiple players and inputs
    - **"Standard" multiplayer** - Each player on own computer, connected via internet
    - **Single screen multiplayer** - Each player controls a character on the same screen
- **Pathing and NPC/enemy AI** - Pathfiding and obstacle avoidance, combat, etc

## Further goals

- **Shapes and collisions** - Better intrrgeated shapes and collision
  - **Physics** - Integration with an actual physics engine
- **Audio effects** - More advanced audio controls and effects
- **Debug tools** - Better integrated console and debugging tools
- ~~**Version control** - Version management and collaboration tools~~
- **More robust git/github integration**, better diff viewer, possibly built-in version control
- **Rework the save format** to be an array, where each object has type, name, and data properties
  - This allows the save format to save the order of objects without __engine_index,
  - and allows folders to be part of the save format
  - Save format, object references, and a lot of other things will have to be updated
