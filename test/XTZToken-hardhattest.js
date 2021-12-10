const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
require('dotenv').config({ path: '.env' });
const minterRole = process.env.MINTER_ROLE;
const burnerRole = process.env.BURNER_ROLE;
const pauserRole = process.env.PAUSER_ROLE;
console.log("*************************************************************************");
describe('XYZToken test', () => {
  let Token,token, owner, addr1, addr2;

  beforeEach(async () => {
    Token = await ethers.getContractFactory('XYZToken');
    token = await Token.deploy();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe('Deployment', async () => {
    it('Should set the right owner', async () => {
      expect(await token.owner()).to.equal(owner.address);
    });

    it('Should assign the total supply of tokens to the owner', async () => {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  })

  describe('Token detail', async () => {
    it('Check tiken name', async () => {
      expect(await token.name()).to.equal("xyzToken");
    });

    it('Check tiken symbol', async () => {
      expect(await token.symbol()).to.equal("XYZT");
    });

    it('Check tiken decimal', async () => {
      expect(await token.decimals()).to.equal(10);
    });
  })

  describe('Role check', async () => {
    it('Check Minter Role', async () => {
      await token.setRole("MINTER_ROLE",owner.address);
      expect(await token.hasRole(minterRole, owner.address)).to.equal(true);
    });
    it('Check Minter Role', async () => {
      expect(await token.hasRole(minterRole, addr1.address)).to.equal(false);
    });

    it('Check Pauser Role', async () => {
      expect(await token.hasRole(pauserRole, owner.address)).to.equal(false);
    });
    it('Check Pauser Role', async () => {
      await token.setRole("PAUSER_ROLE",addr1.address);
      expect(await token.hasRole(pauserRole, addr1.address)).to.equal(true);
    });

    it('Check Burner Role', async () => {
      expect(await token.hasRole(burnerRole, owner.address)).to.equal(false);
    });
    it('Check Burner Role', async () => {
      await token.setRole("BURNER_ROLE",addr2.address);
      expect(await token.hasRole(burnerRole, addr2.address)).to.equal(true);
    });
  })

  describe('Burn function check', async () => {
    it('Should burn by burner role', async () => {
      await token.setRole("MINTER_ROLE",owner.address);
      await token.setRole("BURNER_ROLE",owner.address);
      await token.mint(owner.address, 100);
      await token.burnToken(owner.address, 50);
      expect(await token.balanceOf(owner.address)).to.equal(50);
    });
  })

  describe('Transactions', async () => {
    it('Should transfer tokens between accounts', async () => {
      await token.mint(owner.address, 100);
      await token.transfer(addr1.address, 10);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(10);

      await token.connect(addr1).transfer(addr2.address, 10);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(10);
    });

    it('Should update balances after transfers', async () => {
      await token.mint(owner.address, 100);
      const initialOwnerBalance = await token.balanceOf(owner.address);
      await token.transfer(addr1.address, 10);
      await token.transfer(addr2.address, 20);

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 30);

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(10);

      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(20);
    })
  })

  describe('Pause function check', async () => {
    it('check pause', async () => {
      await token.setRole("PAUSER_ROLE",owner.address);
      await token.pause();
      expect(await token.paused()).to.equal(true);
    });

    it('check unpause', async () => {
      await token.setRole("PAUSER_ROLE",owner.address);
      await token.pause();
      await token.unpause();
      expect(await token.paused()).to.equal(false);
    });
  })

  describe('vote function check', async () => {
    it('check past votes', async () => {
      await token.delegates(owner.address);
      const blockNumber = 1;
      expect(await token.getPastVotes(owner.address, blockNumber)).to.equal(0);
    });

    it('check votes', async () => {
      await token.delegates(owner.address);
      expect(await token.getVotes(owner.address)).to.equal(0);
    });
  })
})
