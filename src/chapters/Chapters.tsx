import { Disassembly } from './Disassembly'
import { Hydromet } from './Hydromet'
import { Pretreatment } from './Pretreatment'
import { Recovered } from './Recovered'
import { SecondLife } from './SecondLife'

/** The process chapters, loaded as their own chunk so the text above appears before three.js arrives. */
export default function Chapters() {
  return (
    <>
      <SecondLife />
      <Disassembly />
      <Pretreatment />
      <Hydromet />
      <Recovered />
    </>
  )
}
