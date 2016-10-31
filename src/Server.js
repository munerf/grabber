var async = require("async");
var http = require("http");
var movies = require("./inputJSON.json");
var mysql = require("mysql");
var movieArray = [];
var pool;
function processDB() {
    var self = this;
    pool = mysql.createPool({
        connectionLimit : 100,
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'MoviesData',
        debug    :  false
    });
    self.collectMovies();
}
processDB.prototype.collectMovies = function() {
    var self = this;
    for(var i=0;i < movies.length;i++) {
        movieArray.push(movies[i].name);
    }
    async.eachSeries(movieArray,self.processMovie,function(){
        console.log("I am done");
    });
}
processDB.prototype.processMovie = function(movieName,callback) {
    var self = this;
    async.waterfall([
    function(callback) {
        var response = "";
        movieName = movieName.split(' ').join('+');
        http.get("http://www.omdbapi.com/?t="+movieName+"&y=&plot=short&r=json",function(res){
            res.on('data',function(chunk){
                response += chunk;
            });
            res.on('end',function(){
                if(typeof response === "string") {
                      response = JSON.parse(response);
                      if(response.Response === 'False') {
                    console.log("Movie not found");
                    callback(true);
                    } else {
                        callback(null,response,movieName);
                    }
                } else {
                    callback(true);
                }
            });
            res.on('error',function(){
                console.log("Some error i think");
                callback(true);
            });
        });
    },
    function(MovieResponse,Movie,callback) {
        var SQLquery = 'INSERT into ?? (??,??,??,??,??,??,??,??,??,??,??,??) VALUES '
                     + '(?,?,?,?,?,?,?,?,?,?,?,?)';
        var inserts = ["movie","Name","ReleaseDate","Year","Cast","Plot","Genre","Rated","RunTime","Poster","Country","Language","Type",MovieResponse.Title,MovieResponse.Released,MovieResponse.Year,MovieResponse.Actors,MovieResponse.Plot,MovieResponse.Genre,MovieResponse.imdbRating,MovieResponse.Runtime,MovieResponse.Poster,MovieResponse.Country,MovieResponse.Language,MovieResponse.Type];
        SQLquery = mysql.format(SQLquery,inserts);

        pool.getConnection(function(err,connection){
            if(err) {
                self.stop(err);
                return;
            } else {
                connection.query(SQLquery,function(err,rows){
                    connection.release();
                    if(err) {
                        console.error('error running query', err);
                    } else {
                        console.log("Inserted rows in DB");
                    }
                });
                callback();
            }
    });
}],function(){
        callback();
});
}
processDB.prototype.stop = function(err) {
    console.log("ISSUE WITH MYSQL \n" + err);
    process.exit(1);
}
new processDB();
