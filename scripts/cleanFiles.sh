#!/bin/bash

if [ -z "$1" ]
	then 
		echo "Hey pal, you need to provide the number of files to clean"
		exit
fi

loc="C:\\workspace\\family-recipes\\src\\assets\\recipes\\"
x=853

while [ $x -le $1 ]
do 
	name=$(printf "%04d" $x)
	file="${loc}${name}.json"
	replace="1/2"

	($sed -i "s#1?2#$replace#" $file)
	
	x=$(( $x + 1 ))
done

