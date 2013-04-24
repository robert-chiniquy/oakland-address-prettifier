#! /usr/bin/env python
# faster with pypy of course

import xml.etree.ElementTree as etree
import json

# Parse an OSM XML file, pulling out the streets ("Ways") and index the intersections

# <tag k="highway" v="primary"/>
# <tag k="name" v="Hegenberger Road"/>
# <tag k="tiger:name_base" v="Hegenberger"/>
# <tag k="tiger:name_type" v="Rd"/>

def get_item_from_tags(name, tags):
  tag = [t for t in tags if t.attrib['k'] == name]
  if len(tag) == 0:
    return None
  tag = tag[0]
  return tag.attrib['v']


class Way:
  node = None
  name = ''
  highway = ''
  name_base = ''
  name_type = ''

  def __init__(self, node):
    tags = node.findall('tag')
    n = get_item_from_tags('name', tags)
    h = get_item_from_tags('highway', tags)
    nb = get_item_from_tags('tiger:name_base', tags)
    nt = get_item_from_tags('tiger:name_type', tags)
    if n is not None:
      self.name = n.title()
    if h is not None:
      self.highway = h.title()
    if nb is not None:
      self.name_base = nb.lower()
    if nt is not None:
      self.name_type = nt.lower()
    nds = node.findall('nd')
    self.nodes = [nd.attrib['ref'] for nd in nds]

  def items(self):
    return [
      self.name,
      #self.highway,
      self.name_base,
      self.name_type
      # TODO: add zip code if street is only in one zip?
    ]

  def __str__(self):
    return ','.join(self.items())

  def __eq__(self, other):
    return self.name == other.name

  def __hash__(self):
    return self.name.__hash__()

def add_intersection(ints, s1, s2):
  if s1 == s2:
    return
  if s1 < s2:
    first = s1
    second = s2
  else:
    first = s2
    second = s1
  if not ints.has_key(s1):
    ints[s1] = []
  if s2 in ints[s1]:
    return
  ints[s1].append(s2)


def intersections(doc):
  points = {} # id -> object
  ints = {} # alphabetically first street name -> alphabetically second street name
  sorted_streets = [s for s in streets(doc)]
  sorted_streets.sort()

  for i in range(len(sorted_streets)):
    street = sorted_streets[i]
    for pt in street.nodes:
      if not points.has_key(pt):
        points[pt] = []
      points[pt].append(i)
  for point in points:
    points[point] = set(points[point])
    if len(points[point]) > 1:
      for name in points[point]:
        for other_name in points[point]:
          add_intersection(ints, name, other_name)
  for i in ints:
    ints[i].sort()
  return ints


def streets(doc):
  ways = [Way(o) for o in doc.getroot().findall('way')]
  for w in ways:
    if w.name != '' and w.highway != '':
      yield(w)


doc = etree.parse('data/map?bbox=-122.3,37.73,-122.2,37.8')
#doc = etree.parse('../data/oakland-area.osm')

result = {}
result['streets'] = list([sn.items() for sn in set([sn for sn in streets(doc)])]) # filter by type?
result['streets'].sort(lambda i, j: cmp(i[0], j[0]))
result['intersections'] = intersections(doc)

print json.dumps(result, sort_keys=True, indent=2)




