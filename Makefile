all: 8 10 12 13 

%:
	n $@ && npm test

.PHONY: all
