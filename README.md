# CicadaHunt Cordova Client

Front-end and entry point of the CicadaHunt app

## Develop

To setup your development environment for the CicadaHunt app: 

* clone this repository
* clone the cicada-detector-plugin::

  ```
  cordova plugin add https://github.com/newforestcicada/cicada-detector-plugin
  ```
* change directory to `platforms` (create if missing) 
* clone the sub-module for the OS you are interested in (Android or iOS). 
  
  * Android: ``git clone https://github.com/newforestcicada/cicadahunt-android``
  * iOS: ``git clone https://github.com/newforestcicada/cicadahunt-ios``

* run the app:
  
  ```
  cordova run <platform> 
  ```
  
  where `<platform>` is `android` or `ios`.



## Download the app

http://newforestcicada.info/apps
