# TeachableReality


## Geting Started

### Dependency
- http-server - https://www.npmjs.com/package/http-server
- openssl - ( [windows](https://slproweb.com/products/Win32OpenSSL.html), [mac](https://stackoverflow.com/questions/35129977/how-to-install-latest-version-of-openssl-mac-os-x-el-capitan) )

### Key Generation
```
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

### Run
```
http-server --ssl
```

## To-do
- Main Feature - High Level
  - 2D output overlay
  - AFrame output overlay
  - tbd - color/tracking
- Immediate Details
  - [ ] Webcam video steam not cropped to 640x480 and take up more of the screen - @RitikVatsal-2019321 
  - [ ] Organize code - @RitikVatsal-2019321
  - [ ] Integrate konva, enable sketching
  - [ ] Enable users to select type of output - overlay, in 3d space,etc
