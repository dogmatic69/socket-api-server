'use strict';

module.exports = (() => {
	const _ = require('lodash'),
		crypto = require('crypto'),
		file = require('jsonfile'),
		fs = require('fs'),
		request = require('request'),
		sprintfJs = require('sprintf-js');

	const sprintf = sprintfJs.sprintf;

	let _self = {};

	const cachePath = (name, url) => {
		name = name || 'http-cache';
		return sprintf('/tmp/%s-%s.json', name, hash(name + url));
	}

	const hash = (key) => {
		return crypto
			.createHash('md5')
			.update(key)
			.digest('hex');
	}

	const modifiedTime = (file) => {
		return new Promise((resolve, reject) => {
				fs.stat(file, (error, data) => {
					if (error) {
						return reject(error);
					}

					return resolve((new Date(data.ctime)).getTime());
				});
			})
			.catch(() => {
				return Promise.resolve(false);
			});
	}

	const parseData = (type, body) => {
		switch (type || 'json') {
			case 'json': {
				return JSON.parse(body);
			}

			default: {
				return body;
			}
		}
	}

	const saveCache = (result) => {
		return new Promise((resolve, reject) => {
			try {
				const cache = cachePath(result.cacheName, result.url);
				file.writeFileSync(cache, result.data);
				result.data = file.readFileSync(cache);
			} catch (err) {
				console.log('Could not save cache');
				return reject(err);
			}

			resolve(result);
		});
	}

/**
 * Fetch local (cached) data.
 *
 * @return Promise
 */
	_self.fetchLocal = (result) => {
		if (result.cache === false) {
			return Promise.resolve(result);
		}
		const cache = cachePath(result.cacheName, result.url);
		return modifiedTime(cache)
			.then((modifiedTime) => {
				const now = (new Date()).getTime();
				if (!modifiedTime || result.ttl(result.url) <= now - modifiedTime) {
					return Promise.resolve(result);
				}

				return new Promise((resolve) => {
					result.source = 'local';
					file.readFile(cache, (error, data) => {
						if (error) {
							console.log('error', error);
						}
						if (!error) {
							result.data = data;
						}
						return resolve(result);
					});
				})
			});
	}

/**
 * Fetch a result directly from the remote source
 *
 * Generally should not be used directly, it wont use any cache.
 *
 * @return Promise
 */
	_self.fetchRemote = (result, post) => {
		if (result.data) {
			return Promise.resolve(result);
		}

		return new Promise((resolve, reject) => {
			const _dealWithRemotRequest = (error, response, body) => {
				if (error || response.statusCode !== 200) {
					return reject(error);
				}
				result.source = 'remote';
				try {
					result.data = parseData(result.type, body);
				} catch (err) {
					console.log('Error parsing remote data');
					return reject(err);
				}
				return resolve(result);
			};

			if (!post) {
				return request(result.url, _dealWithRemotRequest);
			}
			return request.post({url: result.url, form: post}, _dealWithRemotRequest);
		});
	}

/**
 * Fetch a url
 *
 * Options:
 * - cache: false to not cache
 * - cacheName: the name of the cache file
 * - url: the URL to fetch
 */
	_self.fetch = (result) => {
		const startTime = new Date();
		result.time = null;

		return _self.fetchLocal(result)
			.then((result) => {
				if (result.data) {
					result.time = (new Date().getTime() - startTime.getTime()) / 1000;
					return Promise.resolve(result);
				}

				return _self.fetchRemote(result, result.post)
					.then((result) => {
						return result.decorator(result.data)
							.then((data) => {
								result.data = data;
								return Promise.resolve(result);
							});
					})
					.then(saveCache)
					.then((result) => {
						result.time = (new Date().getTime() - startTime.getTime()) / 1000;
						return Promise.resolve(result);
					});
			});
	}

/**
 * API cache config
 *
 * Try local
 * 	- return if found
 * Fetch remote
 * 	- format
 * 	- save
 * 	- return
 *
 * cache: set to false to disable cache, use as a wrapper only
 * cacheName: The name to be used for the cache file
 * decorator: defaults to no formatting of data
 * ttl: method to decide how long cache should live, or time in ms
 * post: post data (will auto use POST if provided)
 * url: the url being requested/posted etc.
 * type: the type of data being fetched.
 *
 * @param object config the configuration options to use
 *
 * @return Promise
 */
	_self.config = (config) => {
		if (!config.decorator) {
			config.decorator = Promise.resolve.bind();
		}

		config.ttl = config.ttl || 1000 * 60;

		if (!_.isFunction(config.ttl)) {
			const ttl = config.ttl;
			config.ttl = () => {
				return ttl;
			}
		}

		return Promise.resolve(config);
	}

	return _self;
})();
