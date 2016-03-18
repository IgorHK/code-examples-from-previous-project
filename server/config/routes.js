var express = require('express');

var aDashboardController = require('../controllers/admin/dashboardController'),
	aLoginController = require('../controllers/admin/loginController'),
	aUserController = require('../controllers/admin/userController'),
	aCustomerController = require('../controllers/admin/customerController'),
	aAuctionController = require('../controllers/admin/auctionController'),
	aSponsorController = require('../controllers/admin/sponsorController'),
	aTriviaController = require('../controllers/admin/triviaController'),
	aItemController = require('../controllers/admin/itemController'),
	cAuctionController = require('../controllers/client/auctionController'),
	cItemController = require('../controllers/client/itemController');



module.exports = function(app, passport) {

    /************ admin routes ***********************/


	/**
	 * User administration
	 */
	app.get('/admin/users', aLoginController.isLoggedIn, aUserController.get);

	app.get('/admin/users/edit', aLoginController.isLoggedIn, aUserController.edit);
	app.post('/admin/users/edit', aLoginController.isLoggedIn, aUserController.save);

	app.get('/admin/users/create', aLoginController.isLoggedIn, aUserController.edit);
	app.post('/admin/users/create', aLoginController.isLoggedIn, aUserController.save);

	app.post('/admin/users/delete', aLoginController.isLoggedIn, aUserController.delete);




	/**
	 * Auction Items
	 */
	app.get('/admin/auction/items',  aLoginController.isLoggedIn, aCustomerController.isCustomerSelected, aItemController.get);
	app.get('/admin/auction/items/edit',  aLoginController.isLoggedIn, aCustomerController.isCustomerSelected, aItemController.edit);
	app.get('/admin/auction/items/create',  aLoginController.isLoggedIn, aCustomerController.isCustomerSelected, aItemController.edit);
	app.post('/admin/auction/items/save',  aLoginController.isLoggedIn, aCustomerController.isCustomerSelected, aItemController.save);
	app.post('/admin/auction/items/delete',  aLoginController.isLoggedIn, aCustomerController.isCustomerSelected, aItemController.delete);
	app.post('/admin/auction/items/image', aItemController.uploadItemImage);




	/************ client routes ***********************/


	///////////////////Auction//////////////////////
	app.post('/client/auctions/getOpenAuctionsByName', cAuctionController.getOpenAuctionsByName);
	app.get('/client/auctions/getOpenAuctions', cAuctionController.getOpenAuctions);
	app.get('/client/auctions/getUpComingAuctions', cAuctionController.getUpComingAuctions);
	app.post('/client/auctions/getUpComingAuctionsByLocation', cAuctionController.getUpComingAuctionsByLocation);
	app.get('/client/auctions/numberOfAuctions',cAuctionController.numberOfAuctions)
	app.get('/client/auctions/getPublicAuctions',cAuctionController.getPublicAuctions)
	app.get('/client/auctions/numberOfNonPublicAuctions',cAuctionController.numberOfNonPublicAuctions)
	app.post('/client/auctions/getNearbyAuctions',cAuctionController.getNearbyAuctions)
	app.get('/client/auctions/getCurrentVirtualAuctions',cAuctionController.getCurrentVirtualAuctions)
	app.get('/client/auctions/getCurrentPublicAuctions',cAuctionController.getCurrentPublicAuctions)
	app.post('/client/auctions/getCurrentNearbyAuctions',cAuctionController.getCurrentNearbyAuctions)
	app.post('/client/auctions/getAuctionDetails',cAuctionController.getAuctionDetails)





	/////////////////////Item//////////////////////////
	app.post('/client/items/itemsOfAuction', cItemController.itemsOfAuction);

    // this is default route

    app.use(function(req, res, next) {
       // if requested url is admin , we redirect to dash board.
        if (req.headers['host'].indexOf('admin.') >= 0) {
            return res.redirect("/admin/dashboard");
        } else {
            // TODO: when time to write client app call client defalut route here
            // if or else redirect to client app
			return res.redirect("/");
        }
		//res.redirect("/admin/dashboard");
    });
}
