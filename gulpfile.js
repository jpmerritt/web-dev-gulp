var //
  gulp               = require( "gulp" ),
  gulpUtil           = require( "gulp-util" ),
  sass               = require( "gulp-ruby-sass" ),
  node_server        = require( "gulp-nodemon" ),
  browser_prefix     = require( "gulp-autoprefixer"),
  minify_css         = require( "gulp-minify-css" ),
  mocha              = require( "gulp-spawn-mocha" ),
  live_reload_server = require( "tiny-lr" )(),
  browser_reload     = require( "gulp-livereload" ),
  growl              = require( "growl" ),
  combine_streams    = require( "stream-combiner" );


// start a live reload server which our browser can subscribe to

gulp.task( "start-live-reload-server", function() {
  live_reload_server.listen( 35729, function( err ) { if (err) console.log( err ) });
});


// runs tests

gulp.task( "run-tests", function() {
  gulp.src( "test/*" )
    .pipe( mocha() )
    	.on( "error", function( err ) {
    		growl( "", { title: "test fail", image: "./client-side/public/images/growl-fail.png" } );
    		console.warn.bind( console );
    	});
} );


// run a development node server

gulp.task( "run-development-server", function() {
  var nodemon_options = {
    script: "front-server.js",
    watch:  ["front-server.js", "node_modules", "lib", "test/*"],
    ext:    "js",
    execMap:  {"js": "node --harmony"},
    env:    { 'NODE_ENV': 'development' }
  };

  running_server = node_server( nodemon_options );

  running_server.on( "restart", function() {
    console.log( "font-server restarted" );
  });

  running_server.on( "crash", function( err ) {
    console.log( "development server crash" );
  })

});


// compile all style files into style.css in the compiled public directory

gulp.task( "compile-sass", function() {
  var //
    sass_options,
    task_streams;

  sass_options = {
    sourcemap    : true,
    style        : "expanded",
    cacheLocation: "../.sass-cache",
    noCache      : true,
    quiet        : false
  };

  task_streams = combine_streams(
    // get style file
    gulp.src( "./client-side/css/style.scss" ),
    // compile sass to css
    sass( sass_options ),
    // add browser prefixers
    browser_prefix( 'last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera >= 12.1', 'ios >= 6', 'android >= 4' ),
    // minify css
    minify_css(),
    // move the files to public/compiled
    gulp.dest( "./client-side/public/compiled" ),
    // reload browser
    browser_reload( live_reload_server )
  );

  // handle stream errors
  task_streams.on( "error", function( error ) {
    console.log( "sass compile error" );
    growl( "sass compile error", { title: "error", image: "./client-side/public/images/growl-fail.png" } );

  } );

});


// watch compile targets for changes and run compile tasks

gulp.task( 'watch', function () {
  gulp.watch( "./client-side/css/**", [ "compile-sass" ] );
  gulp.watch(["test/**", "front-server.js", "node_modules", "lib/*"], [ "run-tests" ] );
});


// tasks run by the default gulp command

gulp.task( "default", [ "run-development-server", "start-live-reload-server", "compile-sass", "watch", "run-tests" ] );