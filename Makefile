MOCHA:= ./node_modules/.bin/mocha
ISTANBUL:= ./node_modules/.bin/nyc
TYPEDOC:= ./node_modules/.bin/typedoc
TSC:= ./node_modules/.bin/tsc
SETMEUP:= ./node_modules/.bin/setmeup

# Clean compiled resources and dependencies
clean:
	rm -rf ./lib
	rm -rf ./node_modules
	rm -f package-lock.json

# Generate TypeScript docs
docs:
	rm -rf ./docs/assets
	rm -rf ./docs/classes
	rm -rf ./docs/interfaces
	rm -rf ./docs/modules
	$(TYPEDOC) --disableOutputCheck

# Compile TypeScript to JS
build:
	$(TSC)

# Update dependencies and set new version
update:
	-ncu -u -x axios,chai,chalk,flatbush
	-ncu -u --target minor
	npm version $(shell date '+%y.%-V%u.1%H%M') --force --allow-same-version --no-git-tag-version
	npm install
	$(TSC)

# Dry run (check if startup() is completing).
dry-run:
	$(TSC)
	node dry-run.js

# Run basic tests.
test:
	$(TSC)
	@NODE_ENV=test $(MOCHA) --trace-warnings --exit -u tdd -R spec

# Deploy to GIT (by creating a new tag)
deploy-git:
	npm version $(shell date '+%y.%-V%u.1%H%M') --force --allow-same-version
	git push
	git push --tags

# Encrypt settings.
encrypt:
	$(SETMEUP) encrypt ./settings.secret.json

# Decrypt settings.
decrypt:
	$(SETMEUP) decrypt ./settings.secret.json

.PHONY: docs test
