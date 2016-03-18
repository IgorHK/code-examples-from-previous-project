$(document).ready(function () {
	$('#end_auction_btn').on('click', function () {
		var auctionName = $('#name').val()

		//Confirmation prompt "Do you really want to stop the auction?
		bootbox.confirm(auctionName+ " will be Stopped:" +"<p/>Press 'OK' to confirm", function (result) {

			//if ok button is pressed than result would be true
			if (result) {
				$('#endDateTime').val(new Date())
				$("[data-id=auction_save_btn]").trigger( "click" );
			}

		});
	});

	$('#delete_btn').on('click', function () {

		if (table) {
			// Collecting all selected row IDs from table.rows('.selected').data()
			var rData = table.rows('.selected').data();
		} else {
			rData = [{DT_RowId: $("#_id").val(), name: $('#name').val()}];
		}
		//Array of selected auction ID
		var idArray = [];
		//List of users to be deleted for a conformation prompt
		var deleteNameList = "";

		//Adding selected users ID to an idArray
		for (var i = 0; i < rData.length; i++) {
			idArray.push(rData[i].DT_RowId);

			//Making a list of users to show in a conformation prompt
			deleteNameList += "<br>&nbsp;&nbsp;<b>"+deleteNameList + rData[i].name+"</b>";
		}

		//Confirmation prompt "Do you really want to delete X users?
		bootbox.confirm("Following auctions will be deleted:" + deleteNameList+"<p/>Press 'OK' to confirm", function (result) {

			//if ok button is pressed than result would be true
			if (result) {


				$.ajax({
					type: "POST",
					url: '/admin/auctions/delete',
					contentType: "application/json",
					// sending a JSON.  An array (DT_RowId) of choosen users is inside.
					data: JSON.stringify({ids: idArray}),

					processData: false,
					error: function (jqXHR, textStatus, errorMessage) {
						//TODO: redirect to error page
						bootbox.alert(errorMessage);
					},
					success: function (data) {
						var deletedMsg = "";
						var wasFailure = false;
						var wasSuccess = false;
						for (var i = 0; i < data.deleted.length; i++) {
							deletedMsg = deletedMsg + data.deleted[i].name + ":" + data.deleted[i].message + "<br>";
							wasFailure =  wasFailure || data.deleted[i].status == "FAILED";
							wasSuccess = wasSuccess ||  data.deleted[i].status == "SUCCESS"
						}

						function reloadList() {
							if (wasSuccess) {
								document.location.href = data.url;
							}
						}
						bootbox.alert(deletedMsg, function () {
							reloadList();
						});

						//redirect to a admin/auctions
						if (!wasFailure) {
							setTimeout(
								reloadList
							, 3000);
						}

					}
				});


			}

		});
	});


	/*----------------------*/
	/***
	 * List
	 */
	var table = null;

	if (($('#table_id').length) > 0) {
		var clientBrowserTimeZoneOffsetInMinutes = (new Date()).getTimezoneOffset();




		var table = $('#table_id').DataTable({
			dom: 'TRC<"clear">lfrtip',
			//serverSide: true,
			ajax: '/admin/auctions?tz='+clientBrowserTimeZoneOffsetInMinutes,
			columns: [
				{
					data: "name",
					"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
						$(nTd).html("<a href='/admin/auctions/edit?auctionId=" + oData.DT_RowId + "'><img src='" + oData.logo + "'>&nbsp;" + oData.name + "</a>");
					}
				},
				{data: "status"},
				{data: "startDateTime"},
				{data: "endDateTime"},
				{data: "createdAt"}
			],
			tableTools: {
				"sSwfPath": "/vendor/DataTables-1.10.5/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
				"aButtons": [
					"copy",
					"print",
					{
						"sExtends": "collection",
						"sButtonText": "Save",
						"aButtons": ["csv", "xls", "pdf"]
					}
				]
			}
		});


		function fixButtonsBasedOnSelection(forceUnselect) {
			if (forceUnselect) {
				$("tr", table.id).removeClass('selected');
			}
			var nSelected = table.rows('.selected').data().length;
			if (nSelected == 1) {
				$("#edit_btn").removeClass("disabled")
				$("#clone_btn").removeClass("disabled")
			} else {
				$("#edit_btn").addClass("disabled")
				$("#clone_btn").addClass("disabled")
			}

			if (nSelected > 0) {
				$("#delete_btn").removeClass("disabled")
			} else {
				$("#delete_btn").addClass("disabled")
			}
		}

		$('tbody', table.id).on('click', 'tr', function () {
			var tr = $(this);
			if (!$("td", this).hasClass("dataTables_empty")) {
				$(this).toggleClass('selected');
			}
			fixButtonsBasedOnSelection();
		});

		table.on('page.dt', function () {
			fixButtonsBasedOnSelection(true);
		});
		$("select", "#table_id_length").on("change", function () {
			fixButtonsBasedOnSelection(true);
		});


		$('#edit_btn').on('click', function () {
			var rData = table.rows('.selected').data();
			if (rData && rData.length == 1) {
				document.location.href = "/admin/auctions/edit?auctionId=" + rData[0].DT_RowId;
			}
		});

		$('#delete_btn').on('click', function () {

			//    table.ajax.reload();
		});


		setInterval( function () {
			table.ajax.reload( null, false ); // user paging is not reset on reload
		}, 30000 );

	}
	/***
	 * Edit
	 */
	var form = $("#auctionedtfrm");

	if (form.length) {


		var fixFormFieldsVisibility = function() {
			if ($("#auctionType", form).val() == "VIRTUAL") {
				$("#isLocationLocked". form).val(false);
				$("#isLocationLocked", form).closest("div.form-group").addClass("hidden");
				$("[id='address[0].acceptedDistance']", form).closest("div.form-group").addClass("hidden");
				$("[id='address[0].country']", form).closest("div.row-nomargin").addClass("hidden");
			} else  {
				$("#isLocationLocked", form).closest("div.form-group").removeClass("hidden");
				$("[id='address[0].acceptedDistance']", form).closest("div.form-group").removeClass("hidden");
				$("[id='address[0].country']", form).closest("div.row-nomargin").removeClass("hidden");
			}


		}

		// call it
		fixFormFieldsVisibility();

		$("#auctionType").change(fixFormFieldsVisibility);
		$('#displayTimeZone').change(function(v){
			var cityField = $("[id='address[0].city']", form);
			if (!cityField.val() && v.target.value.indexOf("/")) {
				cityField.val(v.target.value.split('/')[1]);
			}
			if($('#startDateTime_display').val() != null && $('#startDateTime_display').val() != ""){
				var a = moment.tz($('#startDateTime_display').val(), $("#displayTimeZone").val()).format();
				var b= moment.utc(a).format().substr(0,19)
				b = b + getTimeZoneSettings($("#displayTimeZone").val());
				$('#startDateTime').val(b);
			}
			if($('#endDateTime_display').val() != null && $('#endDateTime_display').val() != ""){
				var a = moment.tz($('#endDateTime_display').val(), $("#displayTimeZone").val()).format();
				var b= moment.utc(a).format().substr(0,19)
				b = b + getTimeZoneSettings($("#displayTimeZone").val());
				$('#endDateTime').val(b);
			}

		});
		if($('#startDateTime').val() != null && $('#startDateTime').val() != ""){
			var startDateTime = $('#startDateTime').val()
			startDateTime = moment(startDateTime).tz($("#displayTimeZone").val()).format('MM/DD/YYYY hh:mm A');
			setTimeout(function() { $('#startDateTime_display').val(startDateTime) }, 100);
		}

		if($('#endDateTime').val() != null && $('#endDateTime').val() != ""){
			var endDateTime = $('#endDateTime').val();
			endDateTime = moment(endDateTime).tz($("#displayTimeZone").val()).format('MM/DD/YYYY hh:mm A');
			setTimeout(function() { $('#endDateTime_display').val(endDateTime) }, 100);

		}
		function getTimeZoneSettings(timezone){
			var a=moment.tz(timezone).utcOffset();
			var ret = "";
			if(a>0){
				var h = Math.floor(a/60);
				if(h<10){
					h = "0"+h.toString();
				}
				else{
					h = h.toString();
				}
				var min = (a % 60);
				if(min<10){
					min = "0"+min.toString();
				}
				else{
					min = min.toString();
				}
				ret = "+"+h+":"+min;
			}
			else{
				a = -(a);
				var h = Math.floor(a/60);
				if(h<10){
					h = "0"+h.toString();
				}
				else{
					h = h.toString();
				}
				var min = (a % 60);
				if(min<10){
					min = "0"+min.toString();
				}
				else{
					min = min.toString();
				}
				ret = "-"+h+":"+min;
			}
			return ret;
		}
		if (!$('#startDateTime_display').data("DateTimePicker")) {
			$("#startDateTime_display").datetimepicker();
		}
		if (!$('#endDateTime_display').data("DateTimePicker")) {
			$("#endDateTime_display").datetimepicker();
		}
		/*if($('#displayTimeZone').val()){

			//$("#startDateTime_display").data("DateTimePicker").minDate(new Date(moment.tz(new Date(), $('#displayTimeZone').val()).format()));
		}
		else{
			//$("#startDateTime_display").data("DateTimePicker").minDate(new Date());
		}
		console.log($('#endDateTime').val(),$("#startDateTime").val())
		if($("#startDateTime").val()){
			$('#startDateTime_display').val(moment.tz($("#startDateTime").val(), $('#displayTimeZone').val()).format());
			//$("#startDateTime_display").val($('#startDateTime').val());
		}
		if($('#endDateTime').val()){
			$('#endDateTime_display').val(moment.tz($('#endDateTime').val(), $('#displayTimeZone').val()).format());
			//$("#endDateTime_display").val($('#endDateTime').val());
		}

		$("#startDateTime_display").on("dp.change", function (e) {
			console.log(moment.tz(e.date._d, $('#displayTimeZone').val()).format())
			$('#endDateTime_display').data("DateTimePicker").minDate(e.date._d);
			$('#startDateTime').val(moment.tz(e.date._d, $('#displayTimeZone').val()).format());
		});
		$("#endDateTime_display").on("dp.change", function (e) {
			console.log(moment.tz(e.date._d, $('#displayTimeZone').val()).format())
			$('#startDateTime_display').data("DateTimePicker").maxDate(e.date._d);
			$('#endDateTime').val(moment.tz(e.date._d, $('#displayTimeZone').val()).format());
		});

		$('#displayTimeZone').change(function(v){
			var cityField = $("[id='address[0].city']", form);
			if (!cityField.val() && v.target.value.indexOf("/")) {
				cityField.val(v.target.value.split('/')[1]);
			}
			console.log(moment.tz(new Date(), $('#displayTimeZone').val()).format());
			$("#startDateTime_display").data("DateTimePicker").minDate(new Date(moment.tz(new Date(), $('#displayTimeZone').val()).format()));
			$('#startDateTime').val(moment.tz($('#startDateTime_display').val(), $('#displayTimeZone').val()).format());
			$('#endDateTime').val(moment.tz($('#endDateTime_display').val(), $('#displayTimeZone').val()).format());

		});*/

		var timezone = jstz.determine();
		if (!$('#displayTimeZone').val()) {
			$('#displayTimeZone').val(timezone.name());
		}


		var geocoder = null;
		var map = null;
		var loc;
		var cust;
		var marker = null;

		var circle;
		var radiusMeters = parseInt($("[id='address[0].acceptedDistance']", form).val() );

		var latlng;
		var firstMap = false;

		function initialize(location) {
			if (!map) {
				geocoder = new google.maps.Geocoder();
				latlng = (location?new google.maps.LatLng(location.lat, location.long):new google.maps.LatLng(-77.036528, 38.897676));
				var mapOptions = {
					zoom: 17,
					center: latlng
				};
				map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

				marker = new google.maps.Marker({
					map: map,
					position: latlng
				});

				circle = new google.maps.Circle({
					center: latlng,
					radius: radiusMeters, // It's meters here in Int
					map: map, 
					fillColor: '#dff0d8',
					fillOpacity: 0.5,
					strokeColor: '#5cb85c', 
					strokeOpacity: 1.0 });

				  map.fitBounds(circle.getBounds());

				firstMap = true;
			}
		}

		function drawCircle(center, radius){
			circle.setOptions({
				center: center,
				radius: radius // It should be meters here
			});

			map.fitBounds(circle.getBounds());
		}

		var place;

		if ($("#location", form).length > 0) {

			var autocomplete = new google.maps.places.Autocomplete($("#location", form)[0]);
			console.log(autocomplete);

			google.maps.event.addListener(autocomplete, 'place_changed', function() {
				place = autocomplete.getPlace();

				var street1Field = $("[id='address[0].street1']", form);
				var street2Field =$("[id='address[0].street2']", form);
				var cityField =  $("[id='address[0].city']", form);
				var stateField = $("[id='address[0].state']", form);
				var zipField = $("[id='address[0].zip']", form);
				var countryField =  $("[id='address[0].country']", form);

				if (!place.geometry) {
					$("#map-canvas", form).addClass("hidden");

					street1Field.val('');
					street2Field.val('');
					cityField.val('');
					stateField.val('');
					zipField.val('');

				} else {

					$("#location", form).closest("div.form-group").removeClass("has-error");

					$("#map-canvas", form).removeClass("hidden");
					initialize();
					if (place.geometry.viewport) {
						map.fitBounds(place.geometry.viewport);
					} else {
						map.setCenter(place.geometry.location);
						map.setZoom(17);  // Why 17? Because it looks good.
					}
					marker.setIcon(/** @type {google.maps.Icon} */({
						url: place.icon,
						size: new google.maps.Size(71, 71),
						origin: new google.maps.Point(0, 0),
						anchor: new google.maps.Point(17, 34),
						scaledSize: new google.maps.Size(35, 35)
					}));
					marker.setPosition(place.geometry.location);
					marker.setVisible(true);

					firstMap = false;

					drawCircle(place.geometry.location,radiusMeters);

					for (var i in place.address_components) {
						var addrComponent = place.address_components[i];
						if (!addrComponent.types || addrComponent.types.length < 1) {
							continue;
						}
						if (addrComponent.types[0] == 'locality' ) {
							cityField.val(addrComponent.short_name);
							continue;
						}
						if (addrComponent.types[0] == 'administrative_area_level_1') {
							stateField.val(addrComponent.short_name);
						}
						if (addrComponent.types[0] == 'street_number') {
							street1Field.val(addrComponent.short_name);
						}
						if (addrComponent.types[0] == 'route') {
							street1Field.val(street1Field.val()+ " " + addrComponent.short_name);
						}

						if (addrComponent.types[0] == 'postal_code') {
							zipField.val(addrComponent.short_name);
						}
						if (addrComponent.types[0] == 'country') {
							countryField.val(addrComponent.short_name);
						}
					}
					var loc = place.geometry;
					document.getElementById("address[0].geometry").value = JSON.stringify({
						'location': {
							'lat': loc.location.lat(),
							'long': loc.location.lng()
						},
						'viewport': {
							'northeast': {
								'lat': loc.viewport?loc.viewport.getNorthEast().lat():null,
								'long': loc.viewport?loc.viewport.getNorthEast().lng():null
							},
							'southwest': {
								'lat': loc.viewport?loc.viewport.getSouthWest().lat():null,
								'long': loc.viewport?loc.viewport.getSouthWest().lng(): null
							}
						}
					});
				}
			});
		}

		var locationSaved = $("[id='address[0].geometry']").val();
		if (locationSaved && $("#auctionType", form).val() != "VIRTUAL") {
			try {
				var l = JSON.parse(locationSaved);
				$("#map-canvas", form).removeClass("hidden");

	//TODO
				initialize(l.location);
			}catch(e){
				console.log("error parsing", locationSaved);
			};
		}

		$("[id='address[0].acceptedDistance']").change(function() {
			var center = (firstMap?latlng:place.geometry.location);
			drawCircle(center, parseInt($("[id='address[0].acceptedDistance']", form).val() ));
		});

		$("[data-id=auction_save_btn]").on('click', function (cb) {

			var doSave= function() {

				var formData = form.serialize();
				$.ajax({
					type: "POST",
					url: $(cb.target).attr('data-form-action'),
					data: formData,
					error: function (jqXHR, textStatus, errorMessage) {
						bootbox.alert(errorMessage);
					},
					success: function (data) {
						//console.log("received data is: ", data)
						form.data('adminform').processResponse(data);
						if (data.status == "FAIL") {
							bootbox.alert(data.message);
						} else {
							if (data.url) {
								bootbox.alert(data.message);
								setTimeout(
									function () {
										document.location.href = data.url;
									}, 3000);
							}
						}
					}
				});
			}
			if($('#startDateTime_display').val() != null && $('#startDateTime_display').val() != ""){
				var a = moment.tz($('#startDateTime_display').val(), $("#displayTimeZone").val()).format();
				var b= moment.utc(a).format().substr(0,19)
				b = b + getTimeZoneSettings($("#displayTimeZone").val());
				$('#startDateTime').val(b);
			}
			if($('#endDateTime_display').val() != null && $('#endDateTime_display').val() != ""){
				var a = moment.tz($('#endDateTime_display').val(), $("#displayTimeZone").val()).format();
				var b = moment.utc(a).format().substr(0,19);
				b = b + getTimeZoneSettings($("#displayTimeZone").val());
				$('#endDateTime').val(b);
			}
			doSave();
		});
	}
});