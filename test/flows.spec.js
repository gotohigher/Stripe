'use strict';

var testUtils = require('./testUtils');
var chai = require('chai');
var when = require('when');
var stripe = require('../lib/stripe')(
  testUtils.getUserStripeKey()
);

var expect = chai.expect;

var CUSTOMER_DETAILS = {
  description: 'Some customer',
  card: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2015
  }
};

var CURRENCY = '_DEFAULT_CURRENCY_NOT_YET_GOTTEN_';

describe('Flows', function() {

  // Note: These tests must be run as one so we can retrieve the 
  // default_currency (required in subsequent tests);

  var cleanup = new testUtils.CleanupUtility();
  this.timeout(30000);

  it('Allows me to retrieve default_currency', function() {
    return expect(
      stripe.account.retrieve()
        .then(function(acct) {
          CURRENCY = acct.default_currency;
          return acct;
        })
    ).to.eventually.have.deep.property('default_currency');
  });

  describe('Plan+Subscription flow', function() {

    it('Allows me to: Create a plan and subcribe a customer to it', function() {

      return expect(
        when.join(
          stripe.plans.create({
            id: 'plan' + +new Date,
            amount: 1700,
            currency: CURRENCY,
            interval: 'month',
            name: 'Gold Super Amazing Tier'
          }),
          stripe.customers.create(CUSTOMER_DETAILS)
        ).then(function(j) {

          var plan = j[0];
          var customer = j[1];

          cleanup.deleteCustomer(customer.id);
          cleanup.deletePlan(plan.id);

          return stripe.customers.updateSubscription(customer.id, {
            plan: plan.id
          });

        })
      ).to.eventually.have.property('status', 'active');

    });

    it('Errors when I attempt to subcribe a customer to a non-existent plan', function() {

      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(customer) {

            cleanup.deleteCustomer(customer.id);

            return stripe.customers.updateSubscription(customer.id, {
              plan: 'someNonExistentPlan' + +new Date
            });

          })
      ).to.be.eventually.rejected;

    });

  });

  describe('Coupon flow', function() {

    it('Allows me to: Create a coupon and subcribe a customer to it', function() {

      var couponId = 'coupon' + +new Date;

      return expect(
        when.join(
          stripe.coupons.create({
            percent_off: 20,
            id: couponId,
            duration: 'once'
          }),
          stripe.customers.create(CUSTOMER_DETAILS)
        ).then(function(j) {

          var coupon = j[0];
          var customer = j[1];

          cleanup.deleteCustomer(customer.id);
          cleanup.deleteCoupon(coupon.id);

          return stripe.customers.update(customer.id, {
            coupon: coupon.id
          });

        })
      ).to.eventually.have.deep.property('discount.coupon.id', couponId);

    });

  });

  describe('Metadata flow', function() {
    it('Can save and retrieve metadata', function() {
      var customer;
      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
            return stripe.customers.setMetadata(cust.id, { foo: "123" });
          })
          .then(function() {
            return stripe.customers.getMetadata(customer.id);
          })
      ).to.eventually.deep.equal({ foo: "123" });
    });
    it('Can reset metadata', function() {
      var customer;
      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
            return stripe.customers.setMetadata(cust.id, { baz: "123" });
          })
          .then(function() {
            return stripe.customers.setMetadata(customer.id, null);
          })
          .then(function() {
            return stripe.customers.getMetadata(customer.id);
          })
      ).to.eventually.deep.equal({});
    });
    it('Resets metadata when setting new metadata', function() {
      var customer;
      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
            return stripe.customers.setMetadata(cust.id, { foo: "123" });
          })
          .then(function() {
            return stripe.customers.setMetadata(customer.id, { baz: "456" });
          })
      ).to.eventually.deep.equal({ baz: "456" });
    });
    it('Can set individual key/value pairs', function() {
      var customer;
      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
          })
          .then(function() {
            return stripe.customers.setMetadata(customer.id, 'baz', 456);
          })
          .then(function() {
            return stripe.customers.setMetadata(customer.id, '_other_', 999);
          })
          .then(function() {
            return stripe.customers.setMetadata(customer.id, 'foo', 123);
          })
          .then(function() {
            // Change foo
            return stripe.customers.setMetadata(customer.id, 'foo', 222);
          })
          .then(function() {
            // Delete baz
            return stripe.customers.setMetadata(customer.id, 'baz', null);
          })
          .then(function() {
            return stripe.customers.getMetadata(customer.id);
          })
      ).to.eventually.deep.equal({ _other_: "999", foo: "222" });
    });
    it('Can get individual metadata keys', function() {
      var customer;
      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
          })
          .then(function() {
            return stripe.customers.setMetadata(customer.id, 'baz', '444');
          })
          .then(function() {
            return stripe.customers.getMetadata(customer.id, 'baz');
          })
      ).to.eventually.become('444');
    });
  });

  describe('Expanding a customer within a charge', function() {
    it('Allows you to expand a customer object', function() {
      return expect(
        stripe.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            cleanup.deleteCustomer(cust.id);
            return stripe.charges.create({
              customer: cust.id,
              amount: 1700,
              currency: CURRENCY,
              expand: ['customer']
            });
          })
      ).to.eventually.have.deep.property('customer.created');
    });
  });

  describe('Getting balance', function() {
    it('Allows me to do so', function() {
      return expect(
        stripe.balance.retrieve()
      ).to.eventually.have.property('object', 'balance');
    });
  });

});