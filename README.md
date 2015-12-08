##### Udacity-Project5

Neighborhood Map

##### Run Instructions

 1) To evaluate project download all files first.
 
 2) Open index.html in a web-browser (Chrome preferred).

##### Application Notes
 1) Search radius was added because I was getting such a large amount of places returned and I wanted to be able to narrow the search to be more specific.
 
 2) The radius has a max of 25 miles because this is approximately the max used by Yelp and Foursquare from what I found. (They do there searches in meters which is why I had to do a conversion)
 
 3) My marker selection from the list, allows for multiple selections which is something I thought about not allowing, but I figure it might give the user some perspective between the distance between the two spots.
 
 4) My styling was pretty simplistic as I feel I didn't have to go to crazy as I wanted it to have a simple feel.
 
 5) Not all of my scripts are asyncrounous because they rely on jquery and knockout.js. I wasn't quite sure how to handle this as I needed to make sure those files loaded first before neighborhood.js could run.
 
 6) My results were sorted based on rating for Yelp (Highest first) and number of checkin's for foursquare (largest number first). Foursquare is better for finding specific places by name (i.e. Pizza Hut).


##### Project Notes

By far my favorite project thus far. Please note the following:

- I didn't minify any of my main files (index.html or neighborhood.js) for ease of evaluation.

- To use the Yelp API, I had use this wonderful link and stack overflow question answer for help:
	http://stackoverflow.com/questions/13149211/yelp-api-google-app-script-oauth

-Most of my error handling is handled by providing defaults and also making console.log error messages for debugging.
	 
-I tried to gracefully handle these errors this way as to not alert the user something was wrong. This is why I tried to display what was returned by the location to the user. I would definitely take advice on how to do this better.
