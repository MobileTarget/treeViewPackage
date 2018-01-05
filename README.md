# Tree view node
---

## Table of Contents
* [What a node is ?](#before_you_begin) 
* [Installation](#init_application)
* [ChangeLog](#change_log)
* [Copyrights](#copyrights)


<a name="before_you_begin"></a>
## What a node is ?
---
Nodes get created when a flow is deployed, they may send and receive some messages whilst the flow is running and they get deleted when the next flow is deployed.

They consist of a pair of files; a JavaScript file that defines what the node does, and an html file that defines the node’s properties, edit dialog and help text.

When packaged as an npm module, a package.json file is used to pull it all together.

<a name="init_application"></a>
## Installation
---
###### Installation in local node-red
Go to project root directory and run the following command.

        sudo npm link   
> (if node is not install as root user the no need to use sudo before command.)
  
 Go to home directory and move to ".node-red" installtion directory and run the again same command above i.e.

        sudo npm link 
> (if node is not install as root user no need to use sudo before command.)
 
 The above both 2 command will create a "symbolic link" between your node-red dashboard code and the actual node project which you were deveolping for node-red.
 Each time when you make any new changes in you node project code, you just need to restart you node-red server and will get the updated output in node-red dashboard.
    
###### Installation on live node-red
To use the node globally in any of you live project you need to publish it on npm globally after that can easily install it inside the node-red via using the following command i.e.

        npm install "node_name" --save

To publish code on npm globally you need to following the following link:- 
        
###### Publishing to npm
>There are lots of guides to publishing a package to the npm repository. A basic overview is available [here](https://docs.npmjs.com/misc/developers)

<a name="change_log"></a>
## Change log
---
##### 0.0.1
* Initial release


<a name="copyrights"></a>
## Copyrights
Copyright 2017 Roger Colburn.

You may not use this file except in compliance with the License.
