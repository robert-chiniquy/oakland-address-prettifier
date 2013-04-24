all: get_streets
	@echo "done"

get_streets: get_data
	@./bin/filter-streets.py > data/streets.json

get_data:
	@[ -e data/map?bbox=-122.3,37.73,-122.2,37.8 ] ||\
		( cd data && wget http://api.openstreetmap.org/api/0.6/map?bbox=-122.3,37.73,-122.2,37.8 )
