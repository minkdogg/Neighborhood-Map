##### Udacity-Project5

Neighborhood Map

##### Run Instructions

 1) To evaluate project download all files.
 
 2) Open index.html in a web-browser (Chrome preferred).
 

##### Application Notes
 1) Search radius was added because I was getting such a large amount of places returned and I wanted to be able to narrow the search to be more specific in certain neighborhoods.
 
 2) The radius has a max of 25 miles because this is approximately the max used by Yelp and Foursquare from what I found. (They do there searches in meters which is why I had to do a conversion)
 
 3) My styling was pretty simplistic as I feel I didn't have to go to crazy as I wanted it to have a simple feel.
 
 4) Not all of my scripts are asyncrounous because they rely on jquery and knockout.js. I wasn't quite sure how to handle this as I needed to make sure those files loaded first before neighborhood.js could run.
 
 5) My results were sorted based on rating for Yelp (Highest first) and number of checkin's for foursquare (largest number first). Foursquare is better for finding specific places by name (i.e. Pizza Hut).
 
 6) I clear the search results when searching a specific neighborhood because I thought it would be nice to have an individual be able to first explore what's in a neighborhood rather than clutter up a map with markers based on a search term. They can then click "find results" to be more specific.


##### Project Notes

Please note the following:

- I didn't minify any of my main files (index.html or neighborhood.js) for ease of evaluation.

- To use the Yelp API, I had use this wonderful link and stack overflow question answer for help:
	http://stackoverflow.com/questions/13149211/yelp-api-google-app-script-oauth

- In Google Chrome, clicking a marker multiple times (setting the marker animation to null) sometimes only allows the marker to bounce once instead of using my set timeout. This may be a browswer specific issue as noted in this stack overflow article:
 	http://stackoverflow.com/questions/20328326/google-maps-api-v3-markers-dont-always-continuously-bounce
