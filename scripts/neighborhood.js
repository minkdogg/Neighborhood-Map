
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

//set mapOptions for google maps
var mapOptions = {
  disableDefaultUI: true
};

// model parameters for each location based on returned data
function locationNeighbor(name,description,rating,latitude,longitude,url,people,checkins,infoWindowAddress) {
  var self = this;
  self.name = name;
  self.description = description;
  self.rating = rating;
  self.latitude = latitude;
  self.longitude = longitude;
  self.combined = name + " - " + "Rating: " + rating;
  self.url = url;
  self.people=people;
  self.checkins = checkins;
  self.infoWindowAddress = infoWindowAddress;
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
  mapNumber: ko.observable("5"),//set max number of returned results to be displayed

  //for use with pinposter function when data is returned from request and creates map marker
  callback : function (results, status) {
    var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
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
    if(place != undefined && data != undefined){
      for(var e in NeighborhoodViewModel.markerArray()){
        if( place.latitude.toFixed(5) == NeighborhoodViewModel.markerArray()[e].position.lat().toFixed(5) &&
            place.longitude.toFixed(5) == NeighborhoodViewModel.markerArray()[e].position.lng().toFixed(5)){
          NeighborhoodViewModel.toggleBounce(NeighborhoodViewModel.markerArray()[e],data)
        }
      }
    }
    else{
      console.log("No data found",place,data);
    }
  },
  //creates google map and adds event listner for page resizing to center map based on markers.
  createMap : function(){
    var location = this.neighborhood();
    var term = this.searchTerm();
    var formatAddressTemp = "";
    var bounds = new google.maps.LatLngBounds();
    var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
    // locations is an array of location strings returned from locationFinder()
    window.mapBounds = new google.maps.LatLngBounds();
    this.pinPoster(location);
    google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      google.maps.event.trigger(map, "resize");
      map.setCenter(center);
    });
  },// end of create map

  //function used to create map marker and info window
  createMapMarker: function(placeData,map){
    var lat = placeData.geometry.location.lat();// latitude from the place service
    var lon = placeData.geometry.location.lng();// longitude from the place service
    var name = placeData.formatted_address;// name of the place from the place service
    var bounds = window.mapBounds;
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name
    });
    var infoWindow = new google.maps.InfoWindow({
      content: name
    });
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
    map.setZoom(18);
    // centers the map
    map.setCenter(bounds.getCenter());
  }.bind(this), //end createMapMarker

  //populates map with the search results requested by user and adds event listener for each marker and sets content of infoWindow.
  populateMap: function(bounds,map){
    var infowindow = new google.maps.InfoWindow();
    for( i = 0; i < this.mapNumber(); i++ ) {
      if (i < this.foundLocations().length){
        var position = new google.maps.LatLng(this.foundLocations()[i].latitude, this.foundLocations()[i].longitude,i);
        bounds.extend(position);
        var marker = new google.maps.Marker({
          position: position,
          map: map,
          title: this.foundLocations()[i].name
        });
        google.maps.event.addListener(marker, 'click', (function (marker, i) {
          return function () {
            infowindow.setContent(NeighborhoodViewModel.foundLocations()[i].infoWindowAddress);
            infowindow.open(map, marker);
            map.setZoom(19);
            map.setCenter(marker.getPosition());
          }
        })(marker,i));
        this.markerArray.push(marker);     
      }
    }
  },
  //creates pagination for results. Set page size(divide page size by 3 to get number of results returned on page)
  //3 elements included per list item which is why we divide by 3. ul.pagination3 defines style from jquery.quick.pagination.
  createPagination: function(){
    var bounds = new google.maps.LatLngBounds();
    var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
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
  toggleBounce: function(marker,data) {
    if (marker.getAnimation() !== null && marker.getAnimation() !== undefined) {
      marker.setAnimation(null);
      data.currentTarget.style.backgroundColor = 'white';
    }
    else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      data.currentTarget.style.backgroundColor = '#C0C0C0';
    }
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
                                                                data.businesses[i].url,null,null,singleInfoWindowAddress));
                }
                else{
                  console.log("Error creating NeighborhoodViewModel place");
                }
              }
              NeighborhoodViewModel.createPagination();
          },
          error: function (xOptions, textStatus, textError) {
            console.log(textError);
          }
      });
  },
  //ajax call to fetch data from Yelp Api
  Foursquare: function(terms,searchMeters){
    $.ajax({
      url: "https://api.foursquare.com/v2/venues/search?client_id=YNIEXZ5YNVOJCQBX4N3DZV12FZHDXEDJOZ0JSHBFWNG12IRE&client_secret=" +
            "4PSDC0XNN0XX2CTJWIFXXPCL4VHLP50JABM4QTKWIGELRDNA&v=20151008&near="+ NeighborhoodViewModel.formattedAddress() +"&query="+terms + "&radius="+searchMeters,
      context: document.body
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
                                                        data.response.venues[i].stats.checkinsCount,singleInfoWindowAddress));
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
    var searchQuery = this.reviewSiteResults();
    var searchMeters = parseInt(this.searchRadius() * 1609);//searchMeters takes the miles inputed and converts to meters which is what the API's expect.
    if (this.formattedAddress() == 'Location Not Found' || this.formattedAddress() == undefined || this.formattedAddress() == null){
      this.formattedAddress('Milwaukee,WI');
    }
    this[searchQuery](terms,searchMeters);
    }
};









