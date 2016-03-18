// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var validate = require('mongoose-validator');

// define the schema for our user model
var userSchema = mongoose.Schema({

	userName: {
			type: {
				firstName: String,
				middleName: String,
				lastName: String
			},
			validate: [
				function(value, done) { // either firstName or lastName should be defined
					done(value.fristName || value.lastName);
				}
				, "User Name cannot be empty, First Last or at least middle name should be specified."
			]
	},
	userType: {
		type: String,
		required: true,
		default: 'USER',
		enum: ['USER', 'ADMIN', 'SYSADMIN']
	},
	adminCustomerIds: {
		type: Array
	},
	createdAt: {
		type: Date,
		default: Date.now

	},
	createdBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true
	},
	isActive: {
		type: Boolean,
		default: true,
		required: true
	},
	contactEmail:  {
		type: String,
		validate:
			[
				validate({
					validator: 'isEmail',
					message: 'E-mail is not in correct format.'
				})/*,
				validate({
					validator: 'isAlphanumeric',
					passIfEmpty: true,
					message: 'E-mail should contain alpha-numeric characters only'
				})
				*/
			]
	},
	contactPhone: {
		type: String
	},

    auth: {
        local: {
            loginId: {
                type: String,
                required: true,
                index: {unique: true}
            },
            passwordHash: {
                type: String,
                required: true
            },
            isResetPending: {
                type: Boolean,
                required: true,
                default: false
            },
        // new properties
            forgotPasswordToken: {
                type: String,
                default: null
            },

            loginAttempts: {
                type: Number,
                required: true,
                default: 0
            },
            lockUntil: {
                type: Number
            }
        },
        facebook: {
            id: String,
            token: String,
            email: String,
            name: String
        },
        twitter: {
            id: String,
            token: String,
            displayName: String,
            username: String
        },
        google: {
            id: String,
            token: String,
            email: String,
            name: String
        }
    }
});

// generating a hash
userSchema.statics.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(passwordHash) {
    return bcrypt.compareSync(passwordHash, this.auth.local.passwordHash);
};


userSchema.methods.getFullName = function(i18n) {
	if (this.userName.middleName) {
		return i18n("userFullName")
			.replace("?FirstName?", this.userName.firstName)
			.replace("?FirstNameInitial?", this.userName.firstName?this.userName.firstName[0]:"")
			.replace("?LastName?", this.userName.lastName)
			.replace("?LastNameInital?", this.userName.lastName?this.userName.lastName[0]:"")
			.replace("?MiddleName?", this.userName.middleName)
			.replace("?MiddleInitial?", this.userName.middleName[0])
	}
	else {
		return i18n("userFullNameNoMiddle")
			.replace("?FirstName?", this.userName.firstName)
			.replace("?LastName?", this.userName.lastName)
			.replace("?LastNameInital?", this.userName.lastName?this.userName.lastName[0]:"")
	}
};

userSchema.methods.getDisplayName = function(i18n) {
	if (this.userName.middleName) {
		return i18n("userDisplayName")
			.replace("?FirstName?", this.userName.firstName)
			.replace("?FirstNameInitial?", this.userName.firstName?this.userName.firstName[0]:"")
			.replace("?LastName?", this.userName.lastName)
			.replace("?LastNameInital?", this.userName.lastName?this.userName.lastName[0]:"")
			.replace("?MiddleName?", this.userName.middleName)
			.replace("?MiddleInitial?", this.userName.middleName[0])
	}
	else {
		return i18n("userDisplayNameNoMiddle")
			.replace("?FirstName?", this.userName.firstName)
			.replace("?LastName?", this.userName.fastName)
	}
};

userSchema.methods.getEmail = function() {
	return this.contactEmail || this.auth.local.loginId || this.auth.facebook.email;
};



//todo What parameters of the user allow him to be deleted???
userSchema.methods.canDelete=function() {
//if it would be true user will be deleted
//if it would be false user will be deactivated

    //true is for a test only


    return false;

};

//my code here
userSchema.methods.deactivate=function(next) {
     this.isActive = false;
     this.save(function (err) {
			next(err);
     });
};

// create the model for users and expose it to our app
var User  = mongoose.model('User', userSchema);
module.exports = User;

module.exports.createDefault  = function() {
    User.find({}).exec(function(err, collection) {
            if (err) {
                throw  err;
            }
            if (collection.length === 0) {
                var user = new User({
					userName: {
						firstName: 'Pamela',
						middleName: 'J',
						lastName: 'Furey'
					},
					userType: 'SYSADMIN',
					contactEmail: 'pam@scoremoremobile.com',
					createdBy: mongoose.Types.ObjectId(),
					auth: {
						local: {
							loginId: 'pam@scoremoremobile.com',
							passwordHash: User.generateHash('password'),
							isResetPending: true
						}
					}
                });
                user.save(function (err) {
                    if (err) {
						console.log(err);
                        throw err;
                    }
                });
				user.createdBy = user._id;
				user.save(function (err) {
					if (err) {
						console.log(err);
						throw err;
					}
				});


				console.log("users created")
            }
        }
    );
};


