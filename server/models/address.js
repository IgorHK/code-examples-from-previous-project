var mongoose = require('mongoose'),
	validate = require('mongoose-validator');

// define the schema for our user model
var AddressSchema = new mongoose.Schema({


	street1: {
		type: String
	},
	street2: {
		type: String
	},
	city: {
		type: String
	},
	state: {
		type: String
	},
	country: {
		type: String
	},
	zip: {
		type: String
	},
	// to keep geolocation of the address
	geometry: {
		location: {
			lat: {
				type: Number
			},
			// geo longitute of the address
			long: {
				type: Number
			}
		},
		viewport: {
			northeast: {
				lat: {
					type: Number
				},
				long: {
					type: Number
				}
			},
			southwest: {
				lat: {
					type: Number
				},
				long: {
					type: Number
				}
			}
		}
	},
	// accepted distance from lat/lang
	acceptedDistance: {
		type: Number,
		default: 305
	}
});

AddressSchema.methods.getFullAddress =function() {

	var addr = "";
	if (this.street1) {
		addr = this.street1;
	}
	if (this.street2) {
		if (addr) {
			addr += " ";
		}
		addr += this.street2;
	}
	if (this.city) {
		if (addr) {
			addr += ", ";
		}
		addr += this.city;
	}
	if (this.state) {
		if (addr) {
			addr += ", ";
		}
		addr += this.state;
	}

	if (this.country) {
		if (addr) {
			addr +=", ";

		}
		addr +=this.country;
	}

	return addr;
};

module.exports=AddressSchema;

