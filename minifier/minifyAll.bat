@echo off
set baseDir=%CD%
echo %baseDir%
set topDir=%baseDir%/../..

set allFilesSize=0
set allFilesCompressedSize=0
set jarCommand=java -jar "%baseDir%"/yuicompressor-2.4.2.jar

echo Starting minification...
echo %topDir%
cd %topDir%/shared/javascript/
del torch.js
del torchFullLibrary.js
cd framework

echo 	Minifying framework files...
echo		Rebuilding torch.js...
echo			Adding InteractiveCanvasHelper.js
type InteractiveCanvasHelper.js >> ../torch.js
echo			Adding CTM.js
type CTM.js >> ../torch.js
echo			Adding AppCommands.js
type AppCommands.js >> ../torch.js
echo			Adding Map.js
type Map.js >> ../torch.js
echo			Adding Location.js
type Location.js >> ../torch.js
echo			Adding Animations.js
type Animations.js >> ../torch.js

echo		torch.js rebuilt!

cd ..
call :compress torch

echo	Framework minification complete!
echo	_

cd objectLibrary
echo	Minifying object library files...

echo		Rebuilding torchFullLibrary.js...
echo			Adding basic.js
type basic.js >> ../torchFullLibrary.js
echo			Adding widgets.js
type widgets.js >> ../torchFullLibrary.js
echo			Adding charting.js
type charting.js >> ../torchFullLibrary.js
echo			Adding 3d.js
type 3d.js >> ../torchFullLibrary.js

echo		torchFullLibrary.js rebuilt!
cd ..
call :compress torchFullLibrary
echo	Object library minification complete!
echo _

echo Minification complete!

cd %baseDir%
set /a allFilesKB=%allFilesSize%/1023
set /a allFilesCompressedKB=%allFilesCompressedSize%/1024
echo Total size of compressed library: %allFilesCompressedKB%KB
echo Total uncompressed size: %allFilesKB%KB
GOTO :eof



rem subroutines

:compress
set uncompNAme=%1.js
set compName=%1.min.js
echo		Minifying %uncompName%
%jarCommand% %uncompName% -o %compName%
call :printSize %uncompName% %compName%
GOTO:eof

:printSize
set oldSize=%~z1
set newSize=%~z2
set /a newSizeP=%newSize%*100
set /a oldSizeP=%oldSize%+1
set /a newPercent=%newSizeP%/%oldSizeP%
echo		Compressed size of %2 is %newSize% bytes
echo			(%newPercent%%% the size of %1 [%oldSize% bytes])
set /a allFilesSize=%allFilesSize%+%oldSize%
set /a allFilesCompressedSize=%allFilesCompressedSize%+%newSize%
GOTO :eof
