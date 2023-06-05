#!/bin/bash

loc="C:\\workspace\\family-recipes\\src\\assets\\recipes\\"
x=912
y=1

while [ $y -le $x ]
do 
	name=$(printf "%04d" $y)
	file="${loc}${name}.json"

	$(sed -i "s#1?4#1/4#" $file)
	$(sed -i "s#1?2#1/2#" $file)
	
	y=$(( $y + 1 ))
done

