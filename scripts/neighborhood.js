
$( document ).ready(function() {
  ko.applyBindings(NeighborhoodViewModel);//activates knockout.js
  NeighborhoodViewModel.neighborhood("Milwaukee,WI");// sets initial map load of Milwaukee, WI (my home neighborhood)
  });

//yelp authentication
 var auth = {
  // Update with your auth tokens.
  consumerKey: "ZAgjJS-SkpB0NEHUkWAfmw",
  consumerSecret: "r_gl01KzA9EnBaglR0P7-SzPYkk",
  accessToken: "EZnWqHtrUEdEw-FNqz28HZ-KrXg6EfAe",
  // the Yelp v2 API with javascript.
  // I wouldn't actually want to expose my access token secret like this in a real application but I don't know how else
  // to get this to work with the Yelp api
  accessTokenSecret: "-Y4PX34FcGM67mWdIq_FA3N1r1s",
  serviceProvider: {
    signatureMethod: "HMAC-SHA1"
  }
};

//set yelp parameters for ajax calls
function getYelpParameters(terms,searchMeters){
  parameters = [];
  parameters.push(['term', terms]);
  parameters.push(['location', NeighborhoodViewModel.formattedAddress()]);
  parameters.push(['callback', 'jsonpResults']);
  parameters.push(['oauth_consumer_key', auth.consumerKey]);
  parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
  parameters.push(['oauth_token', auth.accessToken]);
  parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
  parameters.push(['radius_filter', searchMeters]);
  return parameters;
}
//calculates center of a given map
function calculateCenter(map) {
      center = map.getCenter();
      return center;
    }
// adds event listeners for window resizing
function addMapEventListener(map){
  google.maps.event.addDomListener(map, 'idle', function() {
      center = calculateCenter(map);
    });
    google.maps.event.addDomListener(window, 'resize', function() {
      map.setCenter(center);
    });
}

//set mapOptions for google maps
var mapOptions = {
  disableDefaultUI: true
};

// model parameters for each location based on returned data
function locationNeighbor(name,description,rating,latitude,longitude,url,people,checkins,infoWindowAddress,index,phone) {
  var self = this;
  self.name = name;
  self.description = description;
  self.rating = rating;
  self.latitude = latitude;
  self.longitude = longitude;
  self.combinedNameYelp = index.toString() + ") " + name + " - " + "Rating: " + rating;
  self.combinedNameFoursquare = index.toString() + ") " + name;
  self.url = url;
  self.people=people;
  self.checkins = checkins;
  self.infoWindowAddress = infoWindowAddress;
  self.index = index;
  self.phone = phone;
  self.marker = "";
}

//view model with initial values if needed
var NeighborhoodViewModel = {
  searchTerm : ko.observable(""),
  neighborhood : ko.observable(""),
  review: ko.observable(true),
  reviewSiteResults: ko.observable("Foursquare"),
  foundLocations : ko.observableArray([]),
  url: ko.observable(""),
  people: ko.observable(""),
  checkins: ko.observable(""),
  formattedAddress: ko.observable(""),
  searchResults: ko.observable("0"),
  searchRadius: ko.observable("5"),//allow user to set search radius (max radius is 25 miles)
  markerArray: ko.observableArray([]),
  selectedTarget: ko.observable("null"),
  mapNumber: ko.observable("5"),//set max number of returned results to be displayed
  selectedDiv: ko.observable(null),
  map: ko.observable(""),
  bounds: ko.observable(""),
  errorMessage: ko.observable(""),

  //for use with pinposter function when data is returned from request and creates map marker
  callback : function (results, status) {
    var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
    window.mapBounds = new google.maps.LatLngBounds();
    addMapEventListener(map);

    if (status == google.maps.places.PlacesServiceStatus.OK) {
      NeighborhoodViewModel.createMapMarker(results[0], map);
      formatAddressTemp = results[0]['formatted_address'];
      NeighborhoodViewModel.setAddress(formatAddressTemp);
    }
    else{
      NeighborhoodViewModel.setAddress("Location Not Found");
    }
  },
  //checks to see if list item clicked in sidebar matches marker on map. If it does, toggleBounce is called.
  clickMarker : function(place,data){
    place.marker.infowindow.close();
    NeighborhoodViewModel.map().fitBounds(NeighborhoodViewModel.bounds());
    NeighborhoodViewModel.selectedDiv(place);
    if(place != undefined && data != undefined){
      for(var e in NeighborhoodViewModel.markerArray()){
        NeighborhoodViewModel.markerArray()[e].setAnimation(null);
        NeighborhoodViewModel.foundLocations()[e].marker.infowindow.close();
        if( place.latitude.toFixed(5) == NeighborhoodViewModel.markerArray()[e].position.lat().toFixed(5) &&
            place.longitude.toFixed(5) == NeighborhoodViewModel.markerArray()[e].position.lng().toFixed(5)){
            NeighborhoodViewModel.toggleBounce(NeighborhoodViewModel.markerArray()[e],data,place.marker.infowindow,
                                              NeighborhoodViewModel.foundLocations()[e].name,
                                              NeighborhoodViewModel.foundLocations()[e].phone);
            }
      } 
    }
    else{
      console.log("No data found",place,data);
    }
  },
  //creates google map and adds event listner for page resizing to center map based on markers.
  createMap : function(){
    //resets search results to empty so neighborhood display on map is main focus
    NeighborhoodViewModel.foundLocations([]);
    NeighborhoodViewModel.searchResults("0");
    $("ul.pagination3").quickPagination({pagerLocation:"top",pageSize:"1000"});

    var location = this.neighborhood();
    var term = this.searchTerm();
    var formatAddressTemp = "";
    var bounds = new google.maps.LatLngBounds();
    var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
    // locations is an array of location strings returned from locationFinder()
    window.mapBounds = new google.maps.LatLngBounds();
    this.pinPoster(location);
    addMapEventListener(map);
    NeighborhoodViewModel.map(map);
  },// end of create map

  //function used to create map marker and info window
  createMapMarker: function(placeData,map){
    var lat = placeData.geometry.location.lat();// latitude from the place service
    var lon = placeData.geometry.location.lng();// longitude from the place service
    var name = placeData.formatted_address;// name of the place from the place service
    var bounds = window.mapBounds;
    //updates icon of marker to a different style
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name,
      icon: "http://maps.google.com/mapfiles/marker.png"
    });
    var infoWindow = new google.maps.InfoWindow({
      content: name
    });
    google.maps.event.addListener(marker, 'click', (function () {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      //marker will stop bouncing after 5 seconds
      setTimeout(function(){ marker.setAnimation(null); }, 5000);
    })
    )
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
    infoWindow.open(map, marker);
    map.setZoom(18);
    // centers the map
    map.setCenter(bounds.getCenter());
  }.bind(this), //end createMapMarker

  //populates map with the search results requested by user and adds event listener for each marker and sets content of infoWindow.
  populateMap: function(bounds,map){
    var infowindow = new google.maps.InfoWindow();
    for( i = 0; i < this.mapNumber(); i++ ) {
      if (i < this.foundLocations().length){
        letter = "number_"+(i+1).toString();
        var position = new google.maps.LatLng(this.foundLocations()[i].latitude, this.foundLocations()[i].longitude,i);
        bounds.extend(position);
        //updates marker to include correct number corresponding with list.
        var marker = new google.maps.Marker({
          position: position,
          map: map,
          icon: "icons/" + letter + ".png",
          title: this.foundLocations()[i].name
        });
        google.maps.event.addListener(marker, 'click', (function (marker, i) {
          return function () {
            marker.infowindow.close();
            infowindow.setContent("<p>"+ NeighborhoodViewModel.foundLocations()[i].name + "</p>" + NeighborhoodViewModel.foundLocations()[i].infoWindowAddress);
            infowindow.open(map, marker);
            NeighborhoodViewModel.selectedDiv(NeighborhoodViewModel.foundLocations()[i]);
            map.setZoom(19);
            map.setCenter(marker.getPosition());
            google.maps.event.addListener(marker, 'click', (function () {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){ marker.setAnimation(null); }, 5000);
    })
            )
          }
        })(marker,i));
        this.foundLocations()[i].marker = marker;
        this.foundLocations()[i].marker.infowindow = infowindow;
        this.markerArray.push(marker);     
      }
    }
    NeighborhoodViewModel.map(map);
    NeighborhoodViewModel.bounds(bounds);
  },
  //creates pagination for results. Set page size(divide page size by 3 to get number of results returned on page)
  //3 elements included per list item which is why we divide by 3. ul.pagination3 defines style from jquery.quick.pagination.
  createPagination: function(){
    var bounds = new google.maps.LatLngBounds();
    var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
    window.mapBounds = new google.maps.LatLngBounds();
    addMapEventListener(map);
    this.markerArray([]);
    this.populateMap(bounds,map);
    map.fitBounds(bounds);
    $("ul.pagination3").quickPagination({pagerLocation:"top",pageSize:"15"});
  },
  //returns single neighborhood without search results.
  getNeighborhood : function(){
    if (this.neighborhood() != "") {
    // Adds the item. Writing to the "items" observableArray causes any associated UI to update.
    this.foundLocations.push(new locationNeighbor(this.searchTerm()));
    }
  },
  //used to check if a location is a valid spot for creating a map marker.
  pinPoster : function(locations){
    var service = new google.maps.places.PlacesService(map);
    if (locations != ""){
      var request = {
          query: locations
      };
      service.textSearch(request, this.callback);
    }
    else{
      this.setAddress("Location Not Found");
    }
  },
  //updates the formattedAddress on the index page to display the correct, formatted address the user is looking for.
  setAddress: function (formattedAddressLocation){
    this.formattedAddress(formattedAddressLocation);
  },
  //based on current marker animation and background color, toggle the color and animation of the marker and list item passed in.
  toggleBounce: function(marker,data,info,title,phone) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){ marker.setAnimation(null); }, 5000);
      var infowindow = new google.maps.InfoWindow();
      infowindow.setContent(title + " " + phone);
      infowindow.open(NeighborhoodViewModel.map(), marker);
      marker.infowindow = infowindow;
  },
  //ajax call to fetch data from Yelp Api
  Yelp: function(terms,searchMeters){
    var accessor = {
          consumerSecret: auth.consumerSecret,
          tokenSecret: auth.accessTokenSecret
    };
    var message = {
      'action': 'http://api.yelp.com/v2/search',
      'method': 'GET',
      'parameters': getYelpParameters(terms,searchMeters)
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);
    $.ajax({
          'url': message.action,
          'data': parameterMap,
          'cache': true,
          'dataType': 'jsonp',
          'success': function(data, textStats, XMLHttpRequest) {
              NeighborhoodViewModel.foundLocations([]);
              data.businesses.sort(function(a,b){return b.rating - a.rating});
              NeighborhoodViewModel.searchResults(NeighborhoodViewModel.mapNumber());
              var returnResults = Math.min(data.businesses.length,NeighborhoodViewModel.mapNumber());
              NeighborhoodViewModel.searchResults(returnResults);
              for (i=0; i<returnResults; i += 1){
                if(data.businesses[i] != 'undefined'){
                  var singleInfoWindowAddress = data.businesses[i].location.address[0] + "  " + data.businesses[i].location.city + "," +
                      data.businesses[i].location['state_code'] + " " + data.businesses[i].location['country_code'];
                  NeighborhoodViewModel.foundLocations.push(new locationNeighbor(data.businesses[i].name,data.businesses[i].snippet_text,data.businesses[i].rating,
                                                                data.businesses[i].location.coordinate.latitude,data.businesses[i].location.coordinate.longitude,
                                                                data.businesses[i].url,null,null,singleInfoWindowAddress,(i+1),data.businesses[i]['display_phone']));
                }
                else{
                  console.log("Error creating NeighborhoodViewModel place");
                }
              }
              NeighborhoodViewModel.createPagination();
          },
          error: function (xOptions, textStatus, textError) {
            console.log(textError);
            NeighborhoodViewModel.errorMessage("No Results Found - Enter New Search Term or valid Neighborhood")
            NeighborhoodViewModel.foundLocations("");
          }
      });
  },
  //ajax call to fetch data from Foursquare Api
  Foursquare: function(terms,searchMeters){
    $.ajax({
      url: "https://api.foursquare.com/v2/venues/search?client_id=YNIEXZ5YNVOJCQBX4N3DZV12FZHDXEDJOZ0JSHBFWNG12IRE&client_secret=" +
            "4PSDC0XNN0XX2CTJWIFXXPCL4VHLP50JABM4QTKWIGELRDNA&v=20151008&near="+ NeighborhoodViewModel.formattedAddress() +"&query="+terms + "&radius="+searchMeters,
      context: document.body,
      error: function(xOptions, textStatus, textError){
        console.log(textError);
        NeighborhoodViewModel.errorMessage("No Results Found - Enter New Search Term or valid Neighborhood");
        NeighborhoodViewModel.foundLocations("");
      }
    }).done(function(data) {
      NeighborhoodViewModel.foundLocations([]);
      data.response.venues.sort(function(a,b){return b.stats.checkinsCount - a.stats.checkinsCount});
      var returnResults = Math.min(data.response.venues.length,NeighborhoodViewModel.mapNumber());
      NeighborhoodViewModel.searchResults(returnResults);
      for (i=0; i<returnResults; i += 1){
        if(data.response.venues != 'undefined' || data.response.venues === null){
          if(data.response.venues[i].location.formattedAddress[0] == undefined){
            data.response.venues[i].location.formattedAddress[0] = "";
          }
          if(data.response.venues[i].location.formattedAddress[1] == undefined){
            data.response.venues[i].location.formattedAddress[1] = "";
          }
          if(data.response.venues[i].location.formattedAddress[2] == undefined){
            data.response.venues[i].location.formattedAddress[2] = "";
          }
          var singleInfoWindowAddress = data.response.venues[i].location.formattedAddress[0] + " " + data.response.venues[i].location.formattedAddress[1] + " " +
                                        data.response.venues[i].location.formattedAddress[2];
          NeighborhoodViewModel.foundLocations.push(new locationNeighbor(data.response.venues[i].name,null,null,data.response.venues[i].location.lat,
                                                        data.response.venues[i].location.lng,data.response.venues[i].url,data.response.venues[i].hereNow.summary,
                                                        data.response.venues[i].stats.checkinsCount,singleInfoWindowAddress,(i+1),data.response.venues[i].contact.formattedPhone));
        }
        else{
          console.log("Venue came back undefined");
        }
      }
      NeighborhoodViewModel.createPagination();
    });
  },
  //generic function used to call the appropriate ajax call based on the radio button selected.
  getResults : function(){
    var terms = this.searchTerm();
    if (terms == ""){
      terms = "pizza";
    }
    var searchQuery = this.reviewSiteResults();
    var searchMeters = parseInt(this.searchRadius() * 1609);//searchMeters takes the miles inputed and converts to meters which is what the API's expect.
    if (this.formattedAddress() == 'Location Not Found' || this.formattedAddress() == undefined || this.formattedAddress() == null){
      this.formattedAddress('Milwaukee,WI');
    }
    this[searchQuery](terms,searchMeters);
    }
};









