
ITCHY=./node_modules/.bin/itchy

all:
	$(ITCHY) build win32
	$(ITCHY) build linux
	$(ITCHY) build osx
	$(MAKE) -j4 win32 linux osx

win32: build
	$(ITCHY) publish release win32
	
linux: build
	$(ITCHY) publish release linux

osx: build
	$(ITCHY) publish release osx