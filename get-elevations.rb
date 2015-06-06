#!/usr/bin/env ruby

require 'colorize'
require 'json'
require 'pry'
require 'polylines'


# data/all_sf_locations.txt is in the form of LNG, LAT
$locationsFilename = "data/all_sf_locations.txt"
$elevationsFilename = "data/elevations_first.txt"

$baseURL = "https://maps.googleapis.com/maps/api/elevation/json\\?locations="

$elevationsDictionary = {}


def main
  # fileData = eval(File.read($elevationsFilename))
  # $elevationsDictionary = fileData if fileData

  locationsJSON = JSON.parse(File.read($locationsFilename))

  createURLs(locationsJSON)  
  
  # rewrite the file
  open("data/elevations_first.txt", 'w') { |f|
    f.puts $elevationsDictionary
  }
end


def createURLs(locationsJSON)
  
  paths = locationsJSON['paths']

  firstPathIndex = 0
  lastPathIndex = 0
  successQueries = 0
  failedQueries = 0
  
  testLocationsQuery = String.new($baseURL)
  realLocationsQuery = String.new($baseURL)

  while lastPathIndex < paths.length && successQueries < 2000

    paths[lastPathIndex].each_with_index do |location, index|
      testLocationsQuery << location[1].to_s + ',' + location[0].to_s
      testLocationsQuery << '\\|' if index != paths[lastPathIndex].length - 1
    end
    
    if testLocationsQuery.length < 2000 then
      lastPathIndex += 1
      realLocationsQuery = String.new(testLocationsQuery)
      testLocationsQuery << '\\|'
    else
      
      if firstPathIndex == lastPathIndex then
        # a single query is over limit - skip it
        puts "---> FAILED QUERY ON LINE NUMBER: " + firstPathIndex.to_s
        failedQueries += 1
        
        # do a mini-process on the offending path        
        testLocationsQuery = String.new($baseURL)
        realLocationsQuery = String.new($baseURL)

        paths[lastPathIndex].each_with_index do |location, index|
          # puts index.to_s + "-" + testLocationsQuery.length.to_s
          testLocationsQuery << location[1].to_s + ',' + location[0].to_s
          
          if testLocationsQuery.length < 2000 then
            realLocationsQuery = String.new(testLocationsQuery)
            testLocationsQuery << '\\|'
          else
            puts "created URLs for part of big path " + lastPathIndex.to_s + " through index " + index.to_s + " out of " + paths[lastPathIndex].length.to_s + " (length: " + realLocationsQuery.length.to_s + ")"
            getElevations(realLocationsQuery, firstPathIndex, lastPathIndex)
            
            testLocationsQuery = String.new($baseURL)
            realLocationsQuery = String.new($baseURL)
            testLocationsQuery << location[1].to_s + ',' + location[0].to_s + '\\|'
          end
        end
        puts "created URLs for part of big path " + lastPathIndex.to_s + " through the end of " + paths[lastPathIndex].length.to_s + " (length: " + realLocationsQuery.length.to_s + ")"
        # getElevations(realLocationsQuery, firstPathIndex, lastPathIndex)
        
        
        # done with mini-process
        firstPathIndex += 1
        lastPathIndex += 1
        testLocationsQuery = String.new($baseURL)
        realLocationsQuery = String.new($baseURL)
      else
        puts "created URLs for paths " + firstPathIndex.to_s + "-" + (lastPathIndex - 1).to_s
        getElevations(realLocationsQuery, firstPathIndex, lastPathIndex - 1)
        successQueries += 1
      
        # puts "query number " + successQueries.to_s + " length: " + realLocationsQuery.length.to_s

        testLocationsQuery = String.new($baseURL)
        realLocationsQuery = String.new($baseURL)
        firstPathIndex = lastPathIndex
      end

    end
    
  end
  
  puts "successful queries: " + successQueries.to_s
  puts "failed queries: " + failedQueries.to_s
  
end

def getElevations(url, firstPathIndex, lastPathIndex)
  cmd = "curl " + url.to_s
  rawResult = `#{cmd}`

  begin
    elevationsJSON = JSON.parse(rawResult)
    puts "got elevations for paths " + firstPathIndex.to_s + "-" + lastPathIndex.to_s
  rescue
    puts "JSON parse of the result of a curl FAILED"
    puts rawResult
    puts "nothing added to file"
  end
  
  if !elevationsJSON.nil? then
    if elevationsJSON["status"] == "OK" then
      puts elevationsJSON["results"].length.to_s + " elevations received"
      # puts elevationsJSON
      addElevationsToFile(elevationsJSON, firstPathIndex, lastPathIndex)
    else
      puts "ERROR: " + elevations["status"]
      puts elevations["error_message"] if elevations["error_message"]  
    end
  end
end

def addElevationsToFile(elevationsJSON, firstPathIndex, lastPathIndex)

  # create dictionary from file
  newElevations = 0
  oldElevations = 0

  # add all the new elevations
  elevationsJSON['results'].each { |result|
    locationKey = (result['location']['lat'] * 100000).round.to_s + (result['location']['lng'] * 100000).round.to_s
    newElevations += 1 if !$elevationsDictionary[locationKey.to_i]
    oldElevations += 1 if $elevationsDictionary[locationKey.to_i]
    $elevationsDictionary[locationKey] = result['elevation'].round(1)
  }

  # report range of paths written
  puts "added to dict elevations for paths " + firstPathIndex.to_s + "-" + lastPathIndex.to_s
  puts newElevations.to_s + " elevations added to dict; " + oldElevations.to_s + " were already there"
end



# startIndex = 0
# endIndex = 3

# locationsJSON['paths'][startIndex..endIndex].each_with_index do |path, pathIndex|
#   path.each_with_index do |location, index|
#     locationsLookupString << location[1].to_s + ',' + location[0].to_s
#     locationsLookupString << '\\|' if index != path.length - 1
#     # encoderArray.push([location[1], location[0]])
#   end
#
#   locationsLookupString << '\\|' if pathIndex != endIndex - startIndex
# end





# testEncoderArray =
# [[37.7990234,
# -122.4165852],
# [37.798942,
# -122.417312],
# [37.7171989,
# -122.3989746],
# [37.7189074,
# -122.3994062]]

# encoderArray = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]
# puts "encoderArray:" + encoderArray.to_s
# puts encoderArray

# puts "testEncoderArray" + testEncoderArray.to_s
# # puts testEncoderArray

# if encoderArray == testEncoderArray then
#   puts "equal"
# else
#   puts "not equal"
# end




# puts locationsLookupString
# puts "queryStringLength: " + locationsLookupString.length.to_s + " limit is 2000 char"

# encodedString = Polylines::Encoder.encode_points([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]])

# encodedString = Polylines::Encoder.encode_points(encoderArray)
# puts encodedString
# puts "encoded length: " + encodedString.length.to_s

# puts "querying for " + locationsCount.to_s + " locations..."

# this works to append to file, but we want the file to be more structured
# cmd = "curl https://maps.googleapis.com/maps/api/elevation/json\\?locations=" + locationsLookupString + " >> " + elevationsFilename
# `#{cmd}`

encodedString = "\\\{rueFtndjVNnCz\\\}NsqBuIvAayInCD@FADC\\\`BwBLQcClCmBkCaF\\\}G_J\\\}L"
# cmd = "curl https://maps.googleapis.com/maps/api/elevation/json?locations=37.7990234,-122.4165852" + locationsLookupString # enc:" + encodedString

# puts cmd


# curl "https://maps.googleapis.com/maps/api/elevation/json?locations=enc:\{rueFtndjVNnCz\}NsqBuIvAayInCD@FADC\`BwBLQcClCmBkCaF\}G_J\}L"

# Result format:
# {
#    "results" : [
#       {
#          "elevation" : 0.6340481638908386,
#          "location" : {
#             "lat" : 37.7083,
#             "lng" : -122.393
#          },
#          "resolution" : 76.35161590576172
#       }
#    ],
#    "status" : "OK"
# }


# rawResult = "dummy"
# # rawResult = `#{cmd}`
#
# begin
#   elevations = JSON.parse(rawResult)
# rescue
#   puts "JSON parse of the result of a curl FAILED"
#   puts rawResult
# end
#
# # elevationsDictionary = eval(File.read(elevationsFilename))
# newElevations = 0

# if !elevations.nil? then
#   if elevations["status"] == "OK" then
#     puts elevations["results"].length.to_s + " elevations received"
#     open(elevationsFilename, 'w') { |f|
#       elevations['results'].each { |result|
#         locationKey = (result['location']['lat'] * 100000).round.to_s + (result['location']['lng'] * 100000).round.to_s
#         newElevations += 1 if !elevationsDictionary[locationKey]
#         elevationsDictionary[locationKey] = result['elevation']
#       }
#       f.puts elevationsDictionary
#     }
#   else
#     puts "ERROR: " + elevations["status"]
#     puts elevations["error_message"] if elevations["error_message"]
#
#   end
# end

# puts newElevations.to_s + " are new"

main
