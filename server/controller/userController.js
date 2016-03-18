var User       = require('../../models/user');
var Customer = require('../../models/customer');
var moment = require('moment');

//We use moment-timezone instead of moment to save the date in GMT
//var moment = require('moment-timezone');
var extend = require('extend');
var Q = require('q');

/***
 * Get the editable list of the users for sysAdmin
 * @param req
 * @param res
 * @param next
 * @constructor
 */
exports.get = function(req, res, next) {


	if (!(req.xhr || req.headers.accept.indexOf('json') > -1)) {
		return res.render('./admin/userlist', {
			user: req.user,
			moment: moment
		});
	}

	/* When we would have performance issue here, we will switch to full server site, for now we just spit entire ajax

	var userCollection = User.find({});
	if (req.query["columns"][req.query["order"][0].column].data=="fullName") {
		if (req.query["order"][0].dir=="asc") {
			userCollection.sort(userName.lastName);
		}
	}

	userCollection.exec(function (err, collection) {

		var totalResults = collection.length;

		userCollection.skip(req.query['start']).limit(req.query['length']).exec(function(err, collection) {
			var transformedUsers = collection.map(function (user) {
				return {
					DT_RowId: user._id,
					fullName: user.getFullName(res.__),
					email: user.getEmail(),
					role: user.userType,
					createdAt: moment(user.createdAt).format('L LT')
				}
			});
				res.json({recordsTotal: totalResults, recordsFiltered: totalResults, data: transformedUsers});
		})
	});
	*/

	var resultOffsetInMinutes = req.query.tz?parseInt(req.query.tz)*(-1):0;


	User.find({}).exec(function (err, collection) {
		var transformedUsers = collection.map(function (user) {
			return {
				DT_RowId: user._id,
				fullName: user.getFullName(res.__),
				email: user.getEmail(),
				role: user.userType,
				isActive: user.isActive?res.__("Yes"):res.__("No"),
				//Using a resultOffsetInMinutes to show "createdAt" in a client's browser local time.
				createdAt: moment(user.createdAt).utcOffset(resultOffsetInMinutes).format('L LT')
			}
		});
		res.json({data: transformedUsers});
	});
};


exports.delete = function(req, res, next) {

    var idArray = req.body.ids;

    function deleteSingleUser(id) {

		var deferred = Q.defer();

		User.findOne({_id: id}, function (err, userToDelete) {

            //todo
			//console.log(userToDelete._id, err);

            if (err) {
				deferred.reject(err);
            }
            if (!userToDelete) {
				deferred.reject(err);
            }
            if (userToDelete.canDelete()) {

				//todo
                //console.log('canDelete');


                // now it's time to delete, if delete fails we would need to send back an error
                userToDelete.remove(function (err) {
                    // and now we can send a OK or Failure back to client
                    if (err) {
						deferred.resolve({user: userToDelete.getFullName(res.__), message: res.__("User deletion fails")});
                    } else {
						deferred.resolve({user: userToDelete.getFullName(res.__), message: res.__("User deleted")});

                    }
                });

            } else {

                //todo 
				//console.log('else canDelete ');

                // now it's time to deactivate a user, if deactivation fails we would need to send back an error
                userToDelete.deactivate(function (err) {
                    // and now we can send a OK or Failure back to client

                    //todo
					//console.log('in deactivate', err)

                    if (err) {
						deferred.resolve({user: userToDelete.getFullName(res.__), message: res.__("User deactivation fails")});
                    } else {
						deferred.resolve({name: userToDelete.getFullName(res.__), message: res.__("User deactivated")});
                    }
                });
            }
        });
		return deferred.promise;
    }


    var promisesArray = [];
    for (var i = 0; i < idArray.length; i++) {
        promisesArray.push(
                deleteSingleUser(idArray[i])
        );
    }

    //todo
	//console.log(promisesArray);

    Q.all(promisesArray).then(function(retData) {
       return res.json({delUsers: retData, url: "/admin/users"});
    });

};


/**
 * Produce edit/create form for the user
 * @param req
 * @param res
 * @param next
 */
exports.edit = function(req, res, next) {

	// we need to find out and indicate if ADMIN user can be created or not based on the criteria that there is at least one Customer created
	//It's for active Customers

	function doRender(userToEdit, activeCustomers, adminCustomersArray) {
		res.render("./admin/useredit", {
			user: req.user, // this is logged in user
			formData: userToEdit,
			formPaths: User.schema.paths,
			activeCustomers: activeCustomers,  //If it's true there was at least one active customer created.
			adminCustomers: adminCustomersArray //It's an array of customers linked to a current User we are going to edit.
		});
	}

	//We are looking for active customers here.
	Customer.findOne({isActive:true}, function (err, customers) {
		var aCustomers = false;

		if (err) return handleError(err);

		if (customers != null) {
			aCustomers = true;
		}

		var userIdRequested = req.query['id'];
		//was moved inside a callback
		if (userIdRequested) {
			User.findOne({_id: req.query['id']}, function (err, userToEdit) {
				if (err) {
					console.log(err);
				} else {
					//We query for linked accounts of customers if there are at least one active customer and a user to edit type is ADMIN.
					if (aCustomers == true && userToEdit.userType == "ADMIN") {
						if (userToEdit.adminCustomerIds != null) {

							Customer.find({
								'_id': {$in: userToEdit.adminCustomerIds}
							}, function (err, customers) {
								if (err) return handleError(err);

								doRender(userToEdit, aCustomers, customers);
							});
						} else {
							doRender(userToEdit, aCustomers, []);
						}
					}
					else {
						doRender(userToEdit, aCustomers,[]);
					}
				}
			});
		}
		//end of callback
		else {
			// new user
			doRender(new User(), aCustomers, []);
		}
	});
};

/**
 * process form save for edit / create user. Form can be submitted via form POST but better via ajax request
 * @param req
 * @param res
 * @param next
 */


exports.save = function(req, res, next) {

	User.findOne({_id: req.body['_id']}, function (err, user) {

		var wasNew = false;

		if (user==null) {
			user = new User(req.body);

			var wasNew = true;

			// for new user we have to add some fields manually
			user.createdBy = req.user._id;
			user.auth.local.loginId = user.contactEmail;

			//The date of creation the user is stored in GMT
            user.createdAt = moment.utc(user.createdAt);

		} else {
			if(req.body.isActive == null){
				req.body.isActive = false;
			}
			else{
				req.body.isActive = true;
			}

            //We are saving all details from the body to a user object.
			extend(user, req.body);

			//If user to edit bacame not an ADMIN we delete all linked accounts of customers from adminCustomerIds array.
			if (user.userType != 'ADMIN'){
				user.adminCustomerIds = null;
			}
		}

		var customErrors = {};
		
		// now let's look at was password set or not
		if (req.body['password']) {
			if (req.body['password'] != req.body['confirmpassword']) {
				customErrors['password'] = {message: res.__("Passwords do not match.")};
				customErrors['confirmpassword'] = {message:""};
			}
			else if (req.body['password'].length < 6) {
				customErrors['password'] = {
					message: res.__("Password is too short.")
				}
			} else {
				// looks like attempting to change the password, set a new hash on the user
				user.auth.local.passwordHash = User.generateHash(req.body['password']);
			}
		} else {
			// if password is not passed for new user - make it required field in validation
			if (user.isNew) {
				customErrors['password'] = {
					message: res.__("Password is required for new user.")
				}
			}
		}

		// now let's look at contactPhone and mobilPhone set or not.
		// It's a must to have at least one of phone numbers for userType = ADMIN or userType = SYSADMIN.
		if (user.userType == 'ADMIN'|| user.userType == 'SYSADMIN'){
			if (req.body['contactPhone'].length == 0 && req.body['mobilePhone'].length == 0 ) {
				customErrors['contactPhone'] = {message: res.__("Phone number is required.")};
				customErrors['mobilePhone'] = {message:""}
			}
		}

		// now we can run validate
		user.validate(function(err) {

			if (err && err.errors) {
				for (var e in err.errors) {
					err.errors[e].message = res.__("USER:" + err.errors[e].message);
				}
			}
			if (Object.keys(customErrors).length > 0) {
				if (!err) {
					err= {errors:{}};
				}
				extend(err.errors, customErrors);
			}

			// if validate fails - we need to send back validation results.
			if (err) {

				return res.json(err);

			}
			// now it's time to save, if save fails we would need to send back an error
			user.save(function(err) {
				// and now we can send a OK or Failure back to client
				if (err) {
					res.json({Status: "FAIL", message: res.__(wasNew?"User creation fails":"User data update fails")});
				} else {
					res.json({Status: "SUCCESS", message: res.__(wasNew?"User created":"User updated"), url: "/admin/users"});

				}
			})
		});
	});



};

