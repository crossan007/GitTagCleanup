import { simpleGit, CleanOptions } from 'simple-git';
import log, { getLogger as BaseGetLogger, getLoggers, levels, Logger} from 'loglevel';

const pushRemote = true;
const remoteName = "dev";

(async ()=> {
  log.setDefaultLevel('TRACE')
  const workspace = process.argv[2]
  log.debug(`Workspace: ${workspace}`)
  const git = simpleGit(workspace);
  const tags = await git.tags();
  log.debug("Discovered tags", tags)
  const tagMaps = tags.all.map(t=>(t.match(/^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<extra>.*?)$/))).filter(x=>x)
  const promises: Promise<any>[] = [];
  for (let tp of tagMaps) {
    const original = tp?.[0] as string
    const { major,minor,patch, extra, ...rest} = tp?.groups as Record<string, string>;
    log.debug("Tag", original);
    const newTag = `release/${major}/${original}`
    log.debug(`Tagging ${newTag} from ${original}`)
    await git.tag([newTag, original, "--force"])
    await git.tag(["--delete", original])
    if (pushRemote) {
      promises.concat([
        git.push([remoteName, '--tags', "--force"]),
        git.push(["--delete", remoteName, original])
      ]);
    }
  }
  await Promise.all(promises);

})()
