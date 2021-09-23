IMGDIR := images
SRCDIR := src

all: $(IMGDIR)/deployment.png $(IMGDIR)/dataflow.png

.PHONY: all

$(IMGDIR)/%.png: $(SRCDIR)/%.puml
	cat $< | docker run --rm -i think/plantuml -tpng > $@
