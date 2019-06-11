# TODO List For The Project

## Gameplay

- [x] Add food particles
- [ ] Add death-to-food
- [x] Make the selection glow only apear for the player it is selected for, not everyone on the server.

## Visuals

- [x] Make glowing look less intimidating
- [ ] Create a UI Layer on top of the canvas
- [ ] Add a player count display
- [x] Create full screen Button

## Usability

- [ ] Improve Selection
    - Right click to select; left click to move?
    - Single click to select; double click to move?
    - Single-single to select-move; right click to deselect?
- [x] Cannot leave map
- [ ] Game-over screen
- [x] Zoom out 50%
- [ ] Remove zoom feature/Create scale factor for the game
- [x] Add fullscreen display functionality
  
## Execution

- [ ] Rework game looping to include separation based on necessity
- [ ] Only send data needed
- [x] Send only 1 socket emit to the client, rather than multiple of them
- [ ] Get rid of all object based functionality, everything should be done in the main loop
- [ ] Create global.js for all global variables
- [ ] Create a "heart beat" to determine player idle time, then kick if they are idle for too long
- [ ] Paralellization
- [ ] Rewrite entire Game in c++ and web assymbly, lol
- [ ] Create and send player count to each player, once a second. 
- [ ] Remove ability to select a location outside of the map
- [ ] Replace names that could be inaproprate with names that are, but still related
    -  Example: Dick becomes Richard
- [ ] Create maximum character amount for the name
- [ ] remove nuclear reactions
  

## Unit Testing/Code Testing 

- [ ] Add a library to help with lint an unit tests
- [ ] Create lint and run with gulp
- [ ] Create unit tests and run with gulp
- [ ] Have people play game to see if it works

