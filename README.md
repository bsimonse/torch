torch
=====

True object-oriented framework for making HTML Canvas widgets.

<i>Great, yet another canvas framework.  Don't we have enough of those?</i>

Honestly, the answer is probably yes.  Off the top of my head, I can think of easel.js, cake.js, three.js, KineticJS, not to mention Raphael.js for SVG, and I'm sure there are others.
They're already impressive and shiny in their own ways.

<i>So why bother with this one?</i>

Mostly for fun.  I don't see it being taken too seriously, but at the very least it's a fun experiment with canvas and graphics in general.
Plus, I get to make my own API if I really want to play with something.

<i>What can it do?</i>

If you're familiar with Flash, that's the structure I'm trying to emulate; create objects that can manage their own drawing and events, wrapped in a framework that (hopefully) abstracts away all the boring stuff
like transformation matrices and event delegation.  The existing codebase is fairly robust, and supports making new objects, assigning them events, grouping them together, and running animations.

Conceptually, the endgame is a true GUI development interface, much like Flash, where you can create your environment
visually and export it to a JavaScript file, although you'll always be able to create your own JavaScript controllers by writing code.

Another important thing I want to include is full support for all devices, like touch/multitouch, various and changing screen sizes, and different resolutions.  I see this as the last big hole in
the other frameworks today, and it's only going to become more obvious as the device ecosystem keeps changing.

<i>Can I use it?</i>

Sure... but I'd seriously consider looking at KineticJS or Raphael first.  They're more robust and better-supported.  I'm flattered you asked, though!

<i>Got any examples or documentation?</i>

Not yet!  Sorry.

<i>Why "torch"?</i>

Because it's Flash(lite).
