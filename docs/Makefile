IMGDIR := images
SRCDIR := src

all: $(IMGDIR)/deployment.png

.PHONY: all

$(IMGDIR)/%.png: $(SRCDIR)/%.puml
	cat $< | docker run --rm -i think/plantuml -tpng > $@
