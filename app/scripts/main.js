'use strict';

/*
 Sample of the model.
 {
 "_id": "54346890411874381ca5de69",
 "isActive": true,
 "balance": 2209.94,
 "age": 50,
 "eyeColor": "brown",
 "firstName": "Bertie",
 "lastName": "Williamson",
 "gender": "female",
 "company": "MANUFACT",
 "email": "bertiewilliamson@manufact.com",
 "phone": "(842) 520-2306",
 "address": "586 Lewis Place",
 "state": "South Dakota",
 "registered": "Mon Jun 23 2014 01:17:52 GMT-0700 (PDT)",
 "leadSource": "Google"
 }
*/



//Initialize the crossfilter with our dataset.

(function(win, doc) {
  var cfdata = window.crossfilter(win.data ),
      dimensions = {},
      groups = {};

//We can access the size of our dataset by calling the size() method
  doc.getElementById('dataSize').textContent = cfdata.size();

  doc.getElementById('reset').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    for(var dim in dimensions) {
      dimensions[dim].filterAll();
    }

    renderResults();
  });

//Now we would like to create several dimensions of the data we can analyze.
//First lets make an easy dimension based on current active state
//To make a dimension we call the dimension method on the crossfilter object and pass in a value accessor function.
//This function will be passed each data item and should the value that we would like to apply for the dimension.

  dimensions.isActive = cfdata.dimension( function( d ) {
    return d.isActive;
  });

  dimensions.age = cfdata.dimension( function( d ) {
    return d.age;
  });

  dimensions.state = cfdata.dimension( function( d ) {
    return d.state;
  });

//The trick with dates is to create multiple dimensions based on the date. This will make life easier later on when
//you go group the values later. I like to think that time is a multi-dimensional thing.
  dimensions.registeredDay = cfdata.dimension( function( d ) {
    return new Date( d.registered ).getDay();
  });

  dimensions.registeredHour = cfdata.dimension( function( d ) {
    var date =  new Date( d.registered );

    return date.getHours() + date.getMinutes() / 60;
  });

  dimensions.registeredMonth = cfdata.dimension( function( d ) {
    return new Date( d.registered ).getMonth();
  });

  dimensions.balance = cfdata.dimension( function( d ) {
    return d.balance;
  });

  dimensions.leadSource = cfdata.dimension( function ( d ) {
    return d.leadSource;
  });

//So now we have several dimensions defined. We would like to be able to create groups for each dimension.

  groups.isActiveGroup = dimensions.isActive.group();

  groups.stateGroup = dimensions.state.group();

//We can also provide a function that will return the corresponding rounded value for the grouping.
  groups.ageDecadeGroup = dimensions.age.group( function( age ) {
    return Math.floor( age / 10 );
  });

//We can even create multiple groups for that same dimension.
  groups.ageDemographicGroup = dimensions.age.group( function( age ) {
    var demographic;
    switch ( true ) {
      case age >= 20 && age < 35:
        demographic = '1. Millenial';
        break;
      case age >= 35 && age < 50:
        demographic = '2. Gen X';
        break;
      case age >= 50:
        demographic = '3. Baby Boomer';
        break;
      default:
        demographic = '4. Too Young';
    }
    return demographic;
  });

  groups.registeredByDayGroup = dimensions.registeredDay.group();

  groups.registeredByMonthGroup = dimensions.registeredMonth.group();

  groups.registeredByTimeOfDayGroup = dimensions.registeredHour.group( function( time ) {
    return Math.floor( time );
  });

  groups.balanceByHundredsGroup = dimensions.balance.group( function( bal ) {
    return Math.floor( bal / 100 ) * 100;
  });

//Let's define some custom reduce methods for the gender dimension. This will allow us to get not only the count of
//our customers of each gender, but we can also get the total balance of each gender.

  function sourceReduceAdd(group, data) {
    group.total += data.balance;
    group.count += 1;

    return group;
  }
  function sourceReduceRemove(group, data) {
    group.total -= data.balance;
    group.count -= 1;

    return group;
  }
  function sourceReduceInitial() {
    return {
      total: 0,
      count: 0
    };
  }

  groups.leadSourceGroup = dimensions.leadSource.group().reduce( sourceReduceAdd, sourceReduceRemove, sourceReduceInitial );

  function setData(elem, data) {
    elem.setAttribute('data-cfdatum', JSON.stringify(data));
  };

  function getData(elem) {
    return JSON.parse(elem.parentNode.getAttribute('data-cfdatum'));
  }

  function getDimension(elem) {
    return elem.parentNode.parentNode.parentNode.getAttribute('data-dimension');
  }

  function filterAge(data) {
    var min;
    if(data.key.substring) {
      console.log(data.key.substring(3));
      switch(data.key.substring(3)) {
        case "Millenial":
          dimensions.age.filterRange([20, 34]);
          break;
        case "Gen X":
          dimensions.age.filterRange([35, 49]);
          break;
        case "Baby Boomer":
          dimensions.age.filterRange([50, 100]);
          break;
        default:
          dimensions.age.filterRange([0, 19 ]);
          break;
      }
    } else {
      min = data.key * 10;
      dimensions.age.filterRange([min, min + 9 ]);
    }
  }


  function renderResults() {
    var div, list, html;

    for( var group in groups ) {
      div = doc.getElementById(group);
      div.innerHTML = '';

      list = doc.createElement('ul');

      var addItem = function( data ) {
        var item = doc.createElement('li');

        div.addEventListener('click', function(e) {
          var data, dimension;
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
          if( e.target.tagName === 'A' ) {
            data = getData( e.target );
            dimension = getDimension( e.target );

            if(dimension === 'age') {
              filterAge(data);
            } else {
              dimensions[dimension].filter(data.key);
            }

            renderResults();
          }
        });

        if( group === 'leadSourceGroup') {
          item.innerHTML = '<a href="#">' + data.key + ' : { count :' + data.value.count + ' | total : ' + (data.value.total).toFixed(2) + ' }</a>';
        } else {
          item.innerHTML = '<a href="#">' + data.key + ' : ' + data.value + '</a>';
        }

        setData(item, data);

        list.appendChild(item);
      };

      groups[group].all().forEach( addItem );

      div.appendChild(list);
    }
  }

  renderResults();
})(window, document);

