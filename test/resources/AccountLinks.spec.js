'use strict';

var stripe = require('../../testUtils').getSpyableStripe();
var expect = require('chai').expect;

describe('AccountLinks Resource', function() {
  describe('create', function() {
    it('Sends the correct request', function() {
      stripe.accountLinks.create({
        account: 'acct_123',
        failure_url: 'https://stripe.com/failure',
        success_url: 'https://stripe.com/success',
        type: 'custom_account_verification',
      });

      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        url: '/v1/account_links',
        headers: {},
        data: {
          account: 'acct_123',
          failure_url: 'https://stripe.com/failure',
          success_url: 'https://stripe.com/success',
          type: 'custom_account_verification',
        },
      });
    });
  });
});
