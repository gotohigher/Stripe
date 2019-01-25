'use strict';

var stripe = require('../../testUtils').getSpyableStripe();

var expect = require('chai').expect;
var URL = require('url');
var qs = require('qs');

describe('OAuth', function() {
  describe('authorize', function() {
    describe('when a default client_id is set', function() {
      beforeEach(function() {
        stripe.setClientId('default_client_id');
      });

      it('Uses the correct host', function() {
        var url = stripe.oauth.authorizeUrl();

        var host = URL.parse(url).hostname;

        expect(host).to.equal('connect.stripe.com');
      });

      it('Uses the correct path', function() {
        var url = stripe.oauth.authorizeUrl({state: 'some_state'});

        var pathname = URL.parse(url).pathname;

        expect(pathname).to.equal('/oauth/authorize');
      });

      it('Uses the correct query', function() {
        var url = stripe.oauth.authorizeUrl({state: 'some_state'});

        var query = qs.parse(URL.parse(url).query)

        expect(query.client_id).to.equal('default_client_id');
        expect(query.response_type).to.equal('code');
        expect(query.scope).to.equal('read_write');
        expect(query.state).to.equal('some_state');
      });

      it('Uses a provided client_id instead of the default', function() {
        var url = stripe.oauth.authorizeUrl({client_id: '123abc'});

        var query = qs.parse(URL.parse(url).query)

        expect(query.client_id).to.equal('123abc');
      });

      describe('for Express account', function() {
        it('Uses the correct path', function() {
          var url = stripe.oauth.authorizeUrl({}, {express: true});

          var pathname = URL.parse(url).pathname;

          expect(pathname).to.equal('/express/oauth/authorize');
        });
      });
    });
  });

  describe('token', function() {
    it('Sends the correct request', function() {
      stripe.oauth.token({
        code: '123abc',
        grant_type: 'authorization_code'
      });

      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        host: 'connect.stripe.com',
        url: '/oauth/token',
        headers: {},
        data: {
          code: '123abc',
          grant_type: 'authorization_code'
        },
      });
    });
  });

  describe('deauthorize', function() {
    beforeEach(function() {
      stripe.setClientId('default_client_id');
    });

    it('Sends the correct request without explicit client_id', function() {
      stripe.oauth.deauthorize({
        stripe_user_id: 'some_user_id',
      });

      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        host: 'connect.stripe.com',
        url: '/oauth/deauthorize',
        headers: {},
        data: {
          client_id: stripe.getClientId(),
          stripe_user_id: 'some_user_id'
        },
      });
    });

    it('Sends the correct request with explicit client_id', function() {
      stripe.oauth.deauthorize({
        stripe_user_id: 'some_user_id',
        client_id: '123abc',
      });

      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        host: 'connect.stripe.com',
        url: '/oauth/deauthorize',
        headers: {},
        data: {
          client_id: '123abc',
          stripe_user_id: 'some_user_id'
        },
      });
    });
  });
});
