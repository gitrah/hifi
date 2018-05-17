// creators.scala
// to run, first create the source data 'creators.txt' by typing, in hifi directory
//   grep -r "Created by" > ../creators.txt
// then run creators.scala by typing
//   scala creators.scala
// 
import io.Source
val path ="../creators.txt"
val l = io.Source.fromFile(new java.io.File(path)).getLines.toList
val cb = "Created by"
val nameTimes = for( ll <- l ) yield {
 if(ll.indexOf(cb +":") == -1 && !ll.endsWith("matches")) 
	ll.substring(ll.indexOf(cb) + cb.size).trim
}
val fullNames = for( nt <- nameTimes if nt != null ) yield {
	val ntt = ("" + nt).trim
	val first = ntt.indexOf(" ")
	val second = if(first == -1) -1 else first + 1 + ntt.substring(first+1).indexOf(" ")
	if(second > -1) 
		ntt.substring(0, second)
	else 
		ntt
}
// create map of username -> created file count
var counts = Map[String, Int]()
for(fn <- fullNames) {
	val count = counts.get(fn) match {
              case Some(count) => counts += (fn -> (count + 1))
              case _        => counts += (fn -> 1)
        }
}
val countsSorted = counts.toList.sortWith( _._2 > _._2)  // sort list of (name, count) tuples (created by counts.toList) by file count

for( c <- countsSorted) println(c)

