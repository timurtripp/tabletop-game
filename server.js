/**
 * @file Contains a simple web server implementation for testing the project.
 *
 * Needed because browsers require the `Access-Control-Allow-Origin` header to
 * not break the texture images, even for local files (???).
 */

const fs = require('fs');
const http = require('http');

function startServer(serverPort){
  const server = http.createServer(function(request, response){
    const url = request.url;
    switch (url) {
      case '/':
      case '/index.html':
        fs.readFile(__dirname + '/index.html', (error, data) => {
          if (error) {
            writeError(url, response, error);
            return;
          }
          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.end(data);
        });
      break;
      case '/dist/main.js':
        fs.readFile(__dirname + url, (error, data) => {
          if (error) {
            writeError(url, response, error);
            return;
          }
          response.writeHead(200, { 'Content-Type': 'text/javascript' });
          response.end(data);
        });
      break;
      case '/texture/d20.png':
      case '/texture/d12.png':
      case '/texture/d10.png':
      case '/texture/d8.png':
      case '/texture/d6.png':
      case '/texture/d4.png':
        fs.readFile(__dirname + url, (error, data) => {
          if (error) {
            writeError(url, response, error);
            return;
          }
          response.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' });
          response.end(data);
        });
      break;
      case '/texture/table-composite.jpg':
      case '/texture/wood.jpg':
      case '/texture/ceiling.jpg':
      case '/texture/walls.jpg':
      case '/texture/floor.jpg':
        fs.readFile(__dirname + url, (error, data) => {
          if (error) {
            writeError(url, response, error);
            return;
          }
          response.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*' });
          response.end(data);
        });
      break;
      case '/texture/grid.gif':
        fs.readFile(__dirname + url, (error, data) => {
          if (error) {
            writeError(url, response, error);
            return;
          }
          response.writeHead(200, { 'Content-Type': 'image/gif', 'Access-Control-Allow-Origin': '*' });
          response.end(data);
        });
      break;
      default:
        response.writeHead(404, { 'Content-Type': 'text/html' });
        response.write("<!DOCTYPE HTML>\n<html>\n<head>\n<title>Error 404</title>\n</head>\n<body>\n<h1>Error 404</h1>\n<p>The requested file `" + url + "` isn't recognized.</p>\n</body>\n</html>");
        response.end();
        console.error('A 404 error occured for `%s`.', url);
    }
  });
  server.listen(serverPort);
  console.log('Started server, it should now be accessible over port ' + serverPort + '.');
}

function writeError(url, response, error) {
  response.writeHead(500, { 'Content-Type': 'text/plain' });
  // response.write(error.toString());
  response.end();
  console.error('An error occured for `%s`: %s', url, error.toString());
}

startServer(process.argv[2]);
