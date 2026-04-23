import * as ohm from 'ohm-js';
import { cacheGet, db } from "./storage";
import { checkLastCondition, presetValue } from "./automation";

const automationGrammar = ohm.grammar(String.raw`
    automationGrammar {
      Exp = OrExp

      OrExp = OrExp "OR" AndExp  -- or
            | AndExp
      
      AndExp = AndExp "AND" RelExp  -- and
            | RelExp

      RelExp = 
            | ident "_=[" (">" | "<") digit+ "]" AddExp  -- last_eq
            | ident "_![" (">" | "<") digit+ "]" AddExp  -- last_neq
            | ident "_>[" (">" | "<") digit+ "]" AddExp  -- last_gt
            | ident "_<[" (">" | "<") digit+ "]" AddExp  -- last_lt
            | ident ">>" AddExp  -- inc_above
            | ident "<<" AddExp  -- dec_below
            | AddExp "==" AddExp  -- eq
            | AddExp "!=" AddExp  -- neq
            | AddExp ">=" AddExp  -- geq
            | AddExp "<=" AddExp  -- leq
            | AddExp ">" AddExp  -- gt
            | AddExp "<" AddExp  -- lt
            | AddExp

      AddExp = AddExp "+" MulExp  -- plus
            | AddExp "-" MulExp  -- minus
            | MulExp

      MulExp = MulExp "*" PriExp  -- times
            | MulExp "/" PriExp  -- div
            | PriExp

      PriExp =
            | "(" Exp ")"   -- paren
            | string
            | number
            | preset
            | ident

      preset 
            = caseInsensitive<"date"> 
            | caseInsensitive<"time"> 
            | caseInsensitive<"month"> 
            | caseInsensitive<"day"> 
            | caseInsensitive<"season_northern"> 
            | caseInsensitive<"season_southern"> 
            | caseInsensitive<"sun_position">
      string   
            = "\"" (~"\"" any)* "\""  -- double
            | "'" (~"'" any)* "'"    -- single
      number = digit+ "." digit+  -- withLeading
            | "." digit+   -- leadPoint
            | digit+  -- integer
      ident = (letter | "_") (alnum | "_")* "." (alnum | "_")+
    }
    `);

function getProperties(a: ohm.Node, b: ohm.Node): { topicId: number; topic: string, property: string, targetValue: number | string; } {
  const varName = a.sourceString;
  const targetValue = b.eval();

  const [topic, property] = varName.split('.');
  const topicId = getTopicId(topic);

  return { topicId, topic, property, targetValue };
}

function getTopicId(topic: string): number {
  return <number>db.prepare('SELECT id FROM topics WHERE topic=?').pluck().get(`${process.env.BASE_TOPIC}/${topic}`);
}

export function evaluate(expression: string | undefined) {
  if (!expression || expression.length == 0) return false;

  const match = automationGrammar.match(expression);

  if (match.failed()) {
    throw new Error(match.message);
  }

  const semantics = automationGrammar.createSemantics();
  semantics.addOperation('eval()', {
    OrExp_or(a, _, b) {
      return a.eval() || b.eval();
    },
    AndExp_and(a, _, b) {
      return a.eval() && b.eval();
    },
    RelExp_eq(a, _, b) {
      return a.eval() === b.eval();
    },
    RelExp_neq(a, _, b) {
      return a.eval() !== b.eval();
    },
    RelExp_geq(a, _, b) {
      return a.eval() >= b.eval();
    },
    RelExp_leq(a, _, b) {
      return a.eval() <= b.eval();
    },
    RelExp_gt(a, _, b) {
      return a.eval() > b.eval();
    },
    RelExp_lt(a, _, b) {
      return a.eval() < b.eval();
    },
    RelExp_inc_above(a, _, b) {
      const props = getProperties(a, b);
      const currentValue = cacheGet(props.topicId, props.property);
      if (currentValue <= props.targetValue) return false;

      const history = <{ value: string; }[]>db.prepare('SELECT value FROM pairs WHERE topic_id=? AND name=? and value<>? ORDER BY created_at desc LIMIT 1').all(props.topicId, props.property, currentValue);

      return history.length > 0 && history[0].value < currentValue && history[0].value <= props.targetValue;
    },
    RelExp_dec_below(a, _, b) {
      const props = getProperties(a, b);
      const currentValue = cacheGet(props.topicId, props.property);
      if (currentValue >= props.targetValue) return false;

      const history = <{ value: string; }[]>db.prepare('SELECT value FROM pairs WHERE topic_id=? AND name=? and value<>? ORDER BY created_at desc LIMIT 1').all(props.topicId, props.property, currentValue);

      return history.length > 0 && history[0].value > currentValue && history[0].value >= props.targetValue;
    },
    RelExp_last_eq(a, _op, gtlt, secs, _paren, b) {
      const props = getProperties(a, b);
      const timeOp = `${gtlt.sourceString}${secs.sourceString}`;
      const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value=? ORDER BY created_at desc LIMIT 1').all(props.topicId, props.property, props.targetValue);

      return checkLastCondition(history[0]?.created_at, timeOp);
    },
    RelExp_last_neq(a, _op, gtlt, secs, _paren, b) {
      const props = getProperties(a, b);
      const timeOp = `${gtlt.sourceString}${secs.sourceString}`;
      const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value<>? ORDER BY created_at desc LIMIT 1').all(props.topicId, props.property, props.targetValue);

      return checkLastCondition(history[0]?.created_at, timeOp);
    },
    RelExp_last_gt(a, _op, gtlt, secs, _paren, b) {
      const props = getProperties(a, b);
      const timeOp = `${gtlt.sourceString}${secs.sourceString}`;
      const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value>? ORDER BY created_at desc LIMIT 1').all(props.topicId, props.property, props.targetValue);

      return checkLastCondition(history[0]?.created_at, timeOp);
    },
    RelExp_last_lt(a, _op, gtlt, secs, _paren, b) {
      const props = getProperties(a, b);
      const timeOp = `${gtlt.sourceString}${secs.sourceString}`;
      const history = <{ created_at: string; }[]>db.prepare('SELECT created_at FROM pairs WHERE topic_id=? AND name=? and value<? ORDER BY created_at desc LIMIT 1').all(props.topicId, props.property, props.targetValue);

      return checkLastCondition(history[0]?.created_at, timeOp);
    },
    AddExp_plus(a, _, b) {
      return a.eval() + b.eval();
    },
    AddExp_minus(a, _, b) {
      return a.eval() - b.eval();
    },
    MulExp_times(a, _, b) {
      return a.eval() * b.eval();
    },
    MulExp_div(a, _, b) {
      return a.eval() / b.eval();
    },
    PriExp_paren(_open, inside, _close) {
      return inside.eval();
    },
    preset(preset) {
      const value = presetValue(preset.sourceString.toLowerCase());
      const numeric = Number(value);
      return isNaN(numeric) ? value : numeric;
    },
    string_double(_open, s, _close) {
      return s.sourceString;
    },
    string_single(_open, s, _close) {
      return s.sourceString;
    },
    number_withLeading(d1, _, d2) {
      return parseFloat(d1.sourceString + "." + d2.sourceString);
    },
    number_leadPoint(_, d) {
      return parseFloat("0." + d.sourceString);
    },
    number_integer(d) {
      return parseInt(d.sourceString);
    },
    ident(letter, alnum1, _, alnum2): number | string {
      const topicId = getTopicId(`${letter.sourceString}${alnum1.sourceString}`);
      const value = cacheGet(topicId, alnum2.sourceString);
      const numeric = Number(value);
      return isNaN(numeric) ? value : numeric;
    }
  });
  return semantics(match).eval();
}

export function OhmValidate(value: string, helpers: any) {
  const m = automationGrammar.match(value);

  if (m.failed()) {
    // helpers.message takes a string. 
    // We cast to 'any' to stop the TypeScript "unknown" yelling.
    return helpers.message(m.message as any);
  }

  return value; // Validation passed!
};