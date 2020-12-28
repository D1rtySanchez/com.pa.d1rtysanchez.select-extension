(function() {

	// http://stackoverflow.com/questions/596481/simulate-javascript-key-events
	var resendEvent = function(event) {
		var keyboardEvent = document.createEvent("KeyboardEvent");
		var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";

		keyboardEvent[initMethod](
			"keyup", // event type : keydown, keyup, keypress
			true, // bubbles
			true, // cancelable
			event.view, // viewArg: should be window
			event.ctrlKey, // ctrlKeyArg
			event.altKey, // altKeyArg
			event.shiftKey, // shiftKeyArg
			event.metaKey, // metaKeyArg
			event.keyCode, // keyCodeArg : unsigned long the virtual key code, else 0
			event.keyIdentifier // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
		);
		document.dispatchEvent(keyboardEvent);
	}

	model.currentFocusPlanetId = function() {
		return api.camera.getFocus(api.Holodeck.focused.id).planetId()
	}
	
	model.distance2d = function (p1x, p1y, p2x, p2y) {
		var dx = p2x - p1x;
		var dy = p2y - p1y;
		return Math.sqrt(dx*dx + dy*dy);
	}
	
	model.distance3d = function (v1, v2) {
		var dx = v1[0] - v2[0];
		var dy = v1[1] - v2[1];
		var dz = v1[2] - v2[2];
		return Math.sqrt( dx * dx + dy * dy + dz * dz );
	}
	
	model.normalizeVector = function (x, y, z) {
		if ((x == 0) && (y == 0) && (z == 0)) return [0,0,0];
		var length = Math.sqrt( x*x + y*y + z*z )
		var normalizedVector = [ x/length, y/length, z/length ];
		return normalizedVector;
	}
	
	// *************** Selections **************

	model.toggle_radars = function () {
	
		var zoomLevel = api.camera.getFocus(api.Holodeck.focused.id).zoomLevel();
	
		selectRadarsFix = function () {		
	
			var selectionTypes = model.selectionTypes();
			//console.log (selectionTypes);
			
			var nonRadarTypes = [];
	
			for (var i = 0; i < selectionTypes.length; i++) {
				var selectionType = selectionTypes[i];
				var unitSpec = model.unitSpecs[selectionType];
				//if (zoomLevel !== 'orbital' && zoomLevel !== 'celestial') {
				if (!(_.contains(unitSpec.types,"UNITTYPE_Recon") || (_.contains(unitSpec.types,"UNITTYPE_Structure") && _.contains(unitSpec.types,"UNITTYPE_Bot") && _.contains(unitSpec.types,"UNITTYPE_Scout")) )) {
					nonRadarTypes.push(selectionType);
				}
			}
			
			if (nonRadarTypes.length > 0) {
				model.holodeck.view.selectByTypes("remove", nonRadarTypes);
			}
			
		}
		
		selectRadars = function () {
			if (zoomLevel !== 'orbital' && zoomLevel !== 'celestial') {
				api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Structure', 'Factory');		
				setTimeout(selectRadarsFix,50);
			} else {
				api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Orbital', 'Structure');		
				api.select.fromSelectionWithTypeFilter('Recon', null, false);
			}
		}
		
		// Nothing is selected, select radars directly
		if (!model.selection()) {			

			// Use code below once legion is fixed
//			api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Structure', 'Factory');		
//			api.select.fromSelectionWithTypeFilter('Recon', null, false);

			// HACK temporary until legion adds missing "Recon" tag to the deployed investigator			
			selectRadars();
			
		// Something is selected, if it's radars then deselect them first
		} else {
		
			if (!model.selectionTypes()) return
			var selectionTypes = model.selectionTypes();
			var radarsAlreadySelected = false;
		
			for (var i = 0; i < selectionTypes.length; i++) {
				var selectionType = selectionTypes[i];
				var unitSpec = model.unitSpecs[selectionType];
									
				if (zoomLevel !== 'orbital' && zoomLevel !== 'celestial') {
					console.log (selectionType);
					if ((_.contains(unitSpec.types,"UNITTYPE_Recon") && !_.contains(unitSpec.types,"UNITTYPE_Orbital")) || (_.contains(unitSpec.types,"UNITTYPE_Structure") && _.contains(unitSpec.types,"UNITTYPE_Bot") && _.contains(unitSpec.types,"UNITTYPE_Scout")) ) {
						console.log ("isRadar");
						radarsAlreadySelected = true;
					}
				} else {
					if (_.contains(unitSpec.types,"UNITTYPE_Orbital") && _.contains(unitSpec.types,"UNITTYPE_Recon") ) {
						radarsAlreadySelected = true;
					}				
				}
			}
		
			var selectedSpecs = model.selectionTypes();

			if (radarsAlreadySelected) {
				api.select.empty();
				model.selection(null);
				return;
			} else {
				selectRadars();
			}
			
		}
	}

	model.select_all_fabbers = function () {	
		var zoomLevel = api.camera.getFocus(api.Holodeck.focused.id).zoomLevel();
		if (zoomLevel !== 'orbital' && zoomLevel !== 'celestial') {
			api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Fabber', 'Orbital');
			api.select.fromSelectionWithTypeFilter('Orbital', null, true);
		} else {
			api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Orbital');
			api.select.fromSelectionWithTypeFilter('Fabber', null, false);
		}
	}
	
	// Note this is global, whereas the default select fabbers is on screen only
	model.select_all_idle_fabbers = function () {
		var zoomLevel = api.camera.getFocus(api.Holodeck.focused.id).zoomLevel();
		if (zoomLevel !== 'orbital' && zoomLevel !== 'celestial') {
			api.select.idleFabbersWithTypeFilter (model.currentFocusPlanetId(), 'Fabber', 'Orbital');
			api.select.fromSelectionWithTypeFilter('Orbital', null, true);
		} else {
			api.select.idleFabbersWithTypeFilter (model.currentFocusPlanetId(), 'Orbital');
			//api.select.fromSelectionWithTypeFilter('Fabber', null, false);
		}
	}
	
	model.select_all_scouts = function () {
		api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Scout');
	}
	
	// No built-in way to check idle behaviour (idle fabbers/factories are hardcoded)
	model.select_all_idle_scouts = function () {

		api.select.onPlanetWithTypeFilter(model.currentFocusPlanetId(), 'Scout', 'Structure');
		
		// Code below will execute after a delay, gotta give the api.select time to updat emodel.selection(), then/catch doesn't work
		findIdleScouts = function () {

			if (!model.selection()) return
			
			var units = _.flatten(_.toArray(model.selection().spec_ids));
			api.select.empty();
			model.selection(null);	
			var k = units.length;
			var idleScouts = [];
						
			// Check if unit is idle by comparing 2 positions
			checkIdle = function(myUnitId, unitPos1) {
				//console.log ("myUnitId " + myUnitId);
				api.getWorldView(0).getUnitState(myUnitId).then(function(result) {
					//console.log ("bla2");
					//console.log ("unitId2 " + myUnitId);
					if (one && _.isArray(result)) result = result[0];
					var unitPos2 = result.pos;
					//unitsPosSrc[i] = unitPos;
					//console.log (myUnitId + " 1 | " + unitPos1);
					//console.log (myUnitId + " 2 | " + unitPos2);
					
					// Add to selection array if idle
					if ((unitPos1[0] == unitPos2[0]) && (unitPos1[1] == unitPos2[1]) && (unitPos1[2] == unitPos2[2])) {
						//console.log (myUnitId + " is idle");
						idleScouts.push (myUnitId);
					}
					
					k--;
					if (k == 0) {
						//api.select.empty();
						//model.selection(null);						
						//console.log ("idleScouts length " + idleScouts.length);
						if (!idleScouts) return
						//console.log ("idleScouts length " + idleScouts.length);
						engine.call("select.byIds", idleScouts)
					}
						
					// there will be some code doing fancy stuff here
				})
			}
						
			// Get Initial Positions
//			console.log ("test1");
			//var unitsPosSrc = [];
			//var j = units.length;
			var one = !_.isArray(units[i]);
			for (var i=0; i < units.length; i++) {
				//var unit = units[i];
				//console.log ("unit " + i + " | " + units[i]);								
				var unitId = units[i];
							
				(function(unitId) {					
				
					//console.log (unitId);
					
					api.getWorldView(0).getUnitState(unitId).then(function(result) {
						if (one && _.isArray(result)) result = result[0];
						var unitPos1 = result.pos;
						//unitsPosSrc[i] = unitPos;				
						//console.log (unitId + " 1 | " + unitPos1);
						//console.log ("unitId2 " + myUnitId);
						setTimeout(checkIdle(unitId, unitPos1),50);
					})				
				}(unitId));
			}

		}
		
		setTimeout(findIdleScouts,50);
			
	}

	// *************** Selection Edit **************


	model.single_select_closest = function() {
		if (!model.selection()) return
		var camPos = api.camera.getFocus(api.Holodeck.focused.id).location();
		var camPosN = model.normalizeVector (camPos.x, camPos.y, camPos.z);			// normalize because the camera constantly shift between surface position and normalized position
		//console.log (camPos);
		var closestDistance = Infinity;
		var closestUnit;
		var units = _.flatten(_.toArray(model.selection().spec_ids));
		//console.log(units);
		//var unit = _.chain(model.selection().spec_ids).toArray().flatten().sample().value();
		
		var j = units.length;		
		units.forEach(function(unit) {
			if (!unit) return
			//console.log(unit);
			
			// Get Position
			var one = !_.isArray(unit);
			//var unit2 = unit;
			//if (one) { unit2 = [unit]; }
			var dist = Infinity;
			
			api.getWorldView(0).getUnitState(unit).then(function(result) {				
				if (one && _.isArray(result))
					result = result[0];
				var unitPos = result.pos;			
				var unitPosN = model.normalizeVector (unitPos[0], unitPos[1], unitPos[2]);
				//console.log (unitPos);
				//console.log (camPos);
				//console.log (camPosN);
				//console.log (unitPosN);
				//var dist = model.distance3d ([camPos.x, camPos.y, camPos.z], [unitPos[0], unitPos[1], unitPos[2]]);
				dist = model.distance3d (camPosN, unitPosN) * 100;	// multi for easier debugging
				//console.log(dist);
				
				if (dist < closestDistance) {
					closestDistance = dist;
					closestUnit = unit;
				}
				
				// since this is Async, just putting the final selection here, can't be bothered with callbacks
				j--;
				if (j<=0) {
					//console.log ("final");
					if (!closestUnit) return
					engine.call("select.byIds", [closestUnit])
				}
				
			})

		})
		
		// Select the unit <- need some sort of callback as getpos is in async thread
		/*console.log ("Done1")
		if (!closestUnit) return
		engine.call("select.byIds", [closestUnit])
		console.log ("Done2")*/
	}
	
	// support (siege, anti-air & combat repair units)
	model.only_support_in_selection = function() {
		
		if (!model.selectionTypes()) return
		var selectionTypes = model.selectionTypes();
		var supportTypes = [];
		var nonSupportTypes = [];
		
		for (var i = 0; i < selectionTypes.length; i++) {
			var selectionType = selectionTypes[i];
			var unitSpec = model.unitSpecs[selectionType];
			if (_.contains(unitSpec.types,"UNITTYPE_Artillery") || _.contains(unitSpec.types,"UNITTYPE_AirDefense") || (_.contains(unitSpec.types,"UNITTYPE_Offense") && _.contains(unitSpec.types,"UNITTYPE_Construction")) ) {
				//console.log (selectionType);
				//supportTypes.push(selectionType);
			} else {
				nonSupportTypes.push(selectionType);
			}
		}
		
		if (nonSupportTypes.length > 0) {
			model.holodeck.view.selectByTypes("remove", nonSupportTypes);
		}
		
	}
	
	model.remove_support_from_selection = function() {
		api.select.fromSelectionWithTypeFilter('AirDefense', null, true) 
		api.select.fromSelectionWithTypeFilter('Artillery', null, true)
	}
	
	// siege (long range mobile units)
	model.only_siege_in_selection = function() {
    api.select.fromSelectionWithTypeFilter('Artillery', null, false) }
	model.remove_siege_from_selection = function() {
    api.select.fromSelectionWithTypeFilter('Artillery', null, true) }
	
	// mobile anti-air
	model.only_anti_air_in_selection = function() {
    api.select.fromSelectionWithTypeFilter('AirDefense', null, false) }
	model.remove_anti_air_in_selection = function() {
    api.select.fromSelectionWithTypeFilter('AirDefense', null, true) }
	

	api.Panel.message('', 'inputmap.reload');
})()