/**
 * we are going to place here the search operations
 */

// I'm going to stop ALL ENTER keys..except for fetching a city.
// Note this in case you want to change functionality in your code!!!!
function checkEnter(e) { //e is event object passed from function invocation
  var characterCode //literal character code will be stored in this variable

  if (e && e.which) { //if which property of event object is supported (NN4)
    e = e
    characterCode = e.which //character code is contained in NN4's which property
  }
  else {
    e = event
    characterCode = e.keyCode //character code is contained in IE's keyCode property
  }

  if (characterCode == 13) { //if generated character code is equal to ascii 13 (if enter key)
    event.preventDefault();
    searchCity(document.getElementById('city').value);
    document.getElementById('city').value = '';
    return false
  }
  else {
    return true
  }
}


// I need only results with the type 'Municipality'
var handleSearchResults = function (result) {
  for (const city of result.results) {
    if (city.entityType == 'Municipality') {
      moveMapTo(city.position );
      return;
    }
  }
}

// Search a city, using the Index : GEO ( no need addresses or POIs )
var searchCity = function (name) {
  var API_KEY = Cookies.get('TOMTOM_API_KEY');
  tt.services.fuzzySearch({
    key: API_KEY,
    query: name,
    idxSet: 'Geo'
  })
    .go()
    .then(handleSearchResults);
}