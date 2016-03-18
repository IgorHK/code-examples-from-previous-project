$(document).ready( function () {

	var x = new Date();
	//it's calculating GMT's offset from client's browser time zone, NOT client's browser time zone's offset from GMT.
	//It uses opposite direction for calculation!!! For a test we have -240min (-4h) For GMT+04:00
	var clientBrowserTimeZoneOffsetInMinutes = x.getTimezoneOffset();


	/**
	 *  List
	 */

	var table = $('#table_id').DataTable({
		dom: 'TRC<"clear">lfrtip',
		//serverSide: true,
		ajax: '/admin/users?tz='+clientBrowserTimeZoneOffsetInMinutes,
		columns: [
			{
				data: "fullName",
				"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
					$(nTd).html("<a href='/admin/users/edit?id="+oData.DT_RowId+"'>"+oData.fullName+"</a>");
				}
			},
			{data: "role"},
			{data: "email"},
			{data: "isActive"},
			{data: "createdAt"}
		],
		tableTools: {
			"sSwfPath": "/vendor/DataTables-1.10.5/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
			"aButtons": [
				"copy",
				"print",
				{
					"sExtends":    "collection",
					"sButtonText": "Save",
					"aButtons":    [ "csv", "xls", "pdf" ]
				}
			]
		}
	});


	function fixButtonsBasedOnSelection(forceUnselect)
	{
		if (forceUnselect) {
			$("tr", table.id).removeClass('selected');
		}
		var  nSelected = table.rows('.selected').data().length;
		if (nSelected == 1) {
			$("#edit_btn").removeClass("disabled")
		} else {
			$("#edit_btn").addClass("disabled")
		}

		if (nSelected > 0) {
			$("#delete_btn").removeClass("disabled")
		} else {
			$("#delete_btn").addClass("disabled")
		}
	}

	$('tbody', table.id).on( 'click', 'tr', function () {
		var tr = $(this);
		if (!$("td", this).hasClass("dataTables_empty")) {
			$(this).toggleClass('selected');
		}
		fixButtonsBasedOnSelection();
	});

	table.on( 'page.dt', function () {
		fixButtonsBasedOnSelection(true);
	});
	$("select", "#table_id_length").on("change", function() {
		fixButtonsBasedOnSelection(true);
	});


	$('#edit_btn').on('click', function() {
		var rData= table.rows('.selected').data();
		if (rData && rData.length == 1) {
			document.location.href = "/admin/users/edit?id=" + rData[0].DT_RowId;
		}
	});

	$('#delete_btn').on('click', function() {

		// Collecting all selected row IDs from table.rows('.selected').data()
		var rData= table.rows('.selected').data();

		//Array of selected users ID
		var idArray = [];
		//List of users to be deleted for a conformation prompt
		var deleteUserNameList ="";

		//Adding selected users ID to an idArray
		for (var i = 0; i < rData.length; i++) {
			idArray.push(rData[i].DT_RowId);

			//Making a list of users to show in a conformation prompt
			deleteUserNameList = deleteUserNameList + rData[i].fullName +"<br>";

		}

		//Confirmation prompt "Do you really want to delete X users?
		bootbox.confirm("Do you really want to delete following users:<br>" + deleteUserNameList + "?", function(result) {

			//if ok button is pressed than result would be true
			if (result){


				$.ajax({
					type: "POST",
					url: '/admin/users/delete',
					contentType: "application/json",
					// sending a JSON.  An array (DT_RowId) of choosen users is inside.
					data: JSON.stringify({ids: idArray}),

					processData: false,
					error: function(jqXHR, textStatus, errorMessage) {
						//		bootbox.alert(errorMessage); //  Alert message is switched off.
					},
					success: function(data) {
						var deletedUsers = "";
						for (var i = 0; i < data.delUsers.length; i++) {
							deletedUsers = deletedUsers + data.delUsers[i].name+":"+data.delUsers[i].message +"<br>";
						}
						//show a list of users with a result of deletion
						bootbox.alert(deletedUsers);

						//redirect to a admin/users
						setTimeout(
							function () {
								document.location.href = data.url;
							}, 3000);

					}
				});


			}

		});

		table.ajax.reload();
	});

	var form = $("#useredtfrm");

	$("#password", form).on("change", function(ev) {
		var passwordF = $(ev.target);
		var confirmF = $("#confirmpassword", form);
		if (passwordF.val()) {
			confirmF.closest('.col-sm-6').removeClass('hidden');
			confirmF.focus();
		} else {
			confirmF.val('');
			confirmF.closest('.col-sm-6').addClass('hidden');
		}
	});


	// define actionbuttons on toolbars and link those to the form actions
	$("[data-id=save_btn]").on('click', function(b) {

		var formData = form.serialize();

		$.ajax({
			type: "POST",
			url: $(this).attr('data-form-action'),
			data: formData,
			contentType: 'application/x-www-form-urlencoded',
			processData: false,
			error: function(jqXHR, textStatus, errorMessage) {
				//		bootbox.alert(errorMessage);
			},
			success: function(data) {
				form.data('adminform').processResponse(data);

				if (data.status == "FAIL") {
					//				bootbox.alert(data.message);
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
	});

	$("[data-id=delete_single_btn]").on('click', function() {

		//Array of selected users ID. We use Array for a compatibility with DoDeleteUser reason only.
		var idArray = [];

		//Adding selected users ID to an idArray. We have the only one user in this form.
		idArray.push( $("#_id").val() );

		//Confirmation prompt "Do you really want to delete a user?
		bootbox.confirm("Do you really want to delete a following user ?", function(result) {

			//if ok button is pressed than result would be true
			if (result){

				$.ajax({
					type: "POST",
					url: '/admin/users/delete',
					contentType: "application/json",
					// sending a JSON.  An array (_id) contains the only one user.
					data: JSON.stringify({ids: idArray}),

					processData: false,
					error: function(jqXHR, textStatus, errorMessage) {
						//bootbox.alert(errorMessage);
					},
					success: function(data) {

						//show a users name with a result of deletion
						bootbox.alert(data.delUsers[0].name+":"+data.delUsers[0].message);

						//redirect to a admin/users
						setTimeout(
							function () {
								document.location.href = data.url;
							}, 3000);
					}
				});
			}

		});
		table.ajax.reload();
	});


    var customerTA = $('[data-typeahead-type="choosecustomer"]');

    customerTA.click(function () {
        $(this).select();
    });
    if (customerTA.length > 0) {
        var customers = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10,
            remote: {
                url: '/admin/customers?array=true&name=%QUERY'
            }
        });

        customers.initialize();

        customerTA.typeahead(null, {
            name: 'customers',
            displayKey: 'name',

            source: customers.ttAdapter()
        })
            .on('typeahead:selected', function (evt, item) {

            // do what you want with the item here

				//This code prevents a customer to be added to the Linked Acccounts list twice.
				var ul = $('#adminCustomers');

				var list = ul.find('div');

				var isInList = false;
				for(var i = 0; i < list.length; i++){
					if(list[i].innerHTML === customerTA.val() ) {
						isInList = true;
						break;
					}
				}

				if(isInList)
					alert("Sorry, " + customerTA.val() + " is already in the Linked Accounts list.");
				else
					$('<li></li>').html('<div>' + customerTA.val() + '</div><input type="hidden" id="customer_' + item.DT_RowId + '" name="adminCustomerIds" value=' + item.DT_RowId +'></input><button name="deleteCustomer" class="btn btn-warning btn-xs">Delete</button>').appendTo(ul);


				//todo Is it ok to have this line here?
            customers.clearPrefetchCache();
                // you can add selected customer to the list without clicking the button,, or remove this event lstener and do a button
        });
    }

    //It alows to delete linked accounts of customers from the list of a User.
    $('ul').on('click','button',function(){
        $(this).closest('li').remove();
    });


	//It allows to show <div> linkedAccounts if userType is ADMIN and hide if userType is a SYSADMIN or USER.
	//We set the value of <input id="userTypeSelected"> to save a userType to a database.
	$( ".form-control" ).change(function() {


        //TODO is it better to use
        // var userTypeValue = $('select[class=form-control]').val()
        //TODO   for line 301-302

		var userTypeValue = "";
		$( "select option:selected" ).each(function() {
			userTypeValue = $( this ).text();
			switch (userTypeValue){
				case "ADMIN":$('#linkedAccounts').removeClass('hidden');
					         $('#userTypeSelected').val("ADMIN");
					         break;
				case "SYSADMIN":$('#linkedAccounts').addClass('hidden');
					            $('#userTypeSelected').val("SYSADMIN");
					            break;
				case "USER":$('#linkedAccounts').addClass('hidden');
					        $('#userTypeSelected').val("USER");
					        break;
			}
		});
	});

});
