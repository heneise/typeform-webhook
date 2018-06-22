#!make
MAKEFLAGS += --silent

include .env
export $(shell sed 's/=.*//' .env)

start:
	serverless offline start
deploy:
	serverless deploy -v

.PHONY: start
.PHONY: deploy
