'use strict';

var stripe = require('../testUtils').getSpyableStripe();
var expect = require('chai').expect;

var TEST_AUTH_KEY = 'aGN0bIwXnHdw5645VABjPdSn8nWY7G11';

describe('Account Resource', function() {

  describe('retrieve', function() {

    it('Sends the correct request with no params', function() {

      stripe.account.retrieve();
      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/account',
        data: {},
        headers: {},
      });

    });

    it('Sends the correct request with ID param', function() {

      stripe.account.retrieve('foo');
      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/accounts/foo',
        data: {},
        headers: {},
      });

    });

    it('Sends the correct request with secret key', function() {

      var key = 'sk_12345678901234567890123456789012'
      stripe.account.retrieve(key);
      expect(stripe.LAST_REQUEST).to.deep.equal({
        auth: key,
        method: 'GET',
        url: '/v1/account',
        data: {},
        headers: {},
      });
    });

    it('Sends the correct request with a callback', function() {

      stripe.account.retrieve(function(err, account) {});
      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/account',
        data: {},
        headers: {},
      });

    });

  });

  describe('External account methods', function() {

    describe('retrieveExternalAccount', function() {

      it('Sends the correct request', function() {

        stripe.account.retrieveExternalAccount('accountIdFoo321', 'externalAccountIdFoo456');
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/accounts/accountIdFoo321/external_accounts/externalAccountIdFoo456',
          headers: {},
          data: {}
        });

      });

      it('Sends the correct request [with specified auth]', function() {

        stripe.account.retrieveExternalAccount('accountIdFoo321', 'externalAccountIdFoo456', TEST_AUTH_KEY);
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/accounts/accountIdFoo321/external_accounts/externalAccountIdFoo456',
          headers: {},
          data: {},
          auth: TEST_AUTH_KEY
        });

      });

    });

    describe('createExternalAccount', function() {

      it('Sends the correct request', function() {

        stripe.account.createExternalAccount('accountIdFoo321', {
          number: '123456', currency: 'usd', country: 'US'
        });
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'POST',
          url: '/v1/accounts/accountIdFoo321/external_accounts',
          headers: {},
          data: { number: '123456', currency: 'usd', country: 'US' }
        });

      });

      it('Sends the correct request [with specified auth]', function() {

        stripe.account.createExternalAccount('accountIdFoo321', {
          number: '123456', currency: 'usd', country: 'US'
        }, TEST_AUTH_KEY);
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'POST',
          url: '/v1/accounts/accountIdFoo321/external_accounts',
          headers: {},
          data: { number: '123456', currency: 'usd', country: 'US' },
          auth: TEST_AUTH_KEY
        });

      });

    });

    describe('updateExternalAccount', function() {

      it('Sends the correct request', function() {

        stripe.account.updateExternalAccount('accountIdFoo321', 'externalAccountIdFoo456', {
          default_for_currency: true
        });
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'POST',
          url: '/v1/accounts/accountIdFoo321/external_accounts/externalAccountIdFoo456',
          headers: {},
          data: { default_for_currency: true }
        });

      });

    });

    describe('deleteExternalAccount', function() {

      it('Sends the correct request', function() {

        stripe.account.deleteExternalAccount('accountIdFoo321', 'externalAccountIdFoo456');
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'DELETE',
          url: '/v1/accounts/accountIdFoo321/external_accounts/externalAccountIdFoo456',
          headers: {},
          data: {}
        });

      });

      it('Sends the correct request [with specified auth]', function() {

        stripe.account.deleteExternalAccount('accountIdFoo321', 'externalAccountIdFoo456', TEST_AUTH_KEY);
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'DELETE',
          url: '/v1/accounts/accountIdFoo321/external_accounts/externalAccountIdFoo456',
          headers: {},
          data: {},
          auth: TEST_AUTH_KEY
        });

      });

    });

    describe('listExternalAccounts', function() {

      it('Sends the correct request', function() {

        stripe.account.listExternalAccounts('accountIdFoo321');
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/accounts/accountIdFoo321/external_accounts',
          headers: {},
          data: {}
        });

      });

      it('Sends the correct request [with specified auth]', function() {

        stripe.account.listExternalAccounts('accountIdFoo321', TEST_AUTH_KEY);
        expect(stripe.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/accounts/accountIdFoo321/external_accounts',
          headers: {},
          data: {},
          auth: TEST_AUTH_KEY
        });

      });

    });

  });

});
